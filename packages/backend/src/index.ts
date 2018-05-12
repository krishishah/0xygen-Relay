/** App entry point lives here */
import 'reflect-metadata';
import { useContainer as ormUseContainer, createConnection } from 'typeorm';
import { Container } from 'typedi';
import * as http from 'http';
import * as debug from 'debug';
import { App } from './app';
import { create } from 'domain';
import { Application } from 'express';
import * as express from 'express';
import { ServerClient } from './utils/serverClient';
import { server as WebSocketServer, request as WebSocketRequest } from 'websocket';
import { OrderStateWatcherConfig } from '0x.js/lib/src/types';
import { BlockParamLiteral } from '0x.js';

const host: string = process.env.HOST || 'localhost';
const httpPort: number = normalizePort(process.env.PORT || 3000) as number;
const wsPort: number = normalizePort(process.env.WSPORT || 3001) as number;

export const KOVAN_NETWORK_ID: number = 42;
export const KOVAN_RPC: string = 'https://kovan.infura.io/WJFq23sRIxeu7Snltrjq';

export const TEST_RPC_NETWORK_ID: number = 50;
export const TEST_RPC: string = 'http://localhost:8545';

export const orderStateWatcherConfig: OrderStateWatcherConfig = {
    // orderExpirationCheckingIntervalMs: 200,
    // eventPollingIntervalMs: 200,
    // expirationMarginMs: 100,
    // cleanupJobIntervalMs: 100000,
    stateLayer: BlockParamLiteral.Latest
};

async function createServer(): Promise<Express.Application> {
    debug('ts-express:server');

    ormUseContainer(Container);
    // Create connection with Database
    // Config read from ormconfig.json file
    return createConnection().then(async dbConnection => {
        let expressServer = Container.get(App).express;

        const wsServer = Container.get(App).wsServer;
        const httpServer = http.createServer(expressServer);

        httpServer.listen(
            httpPort, 
            host, 
            () => console.log(`Standard relayer API (HTTP) listening on port ${httpPort}`)
        );
        httpServer.on('error', onError);

        wsServer
            .config
            .httpServer[0]
            .listen(
                wsPort,
                host, 
                () => console.log(`Standard relayer API (WS) listening on port  ${wsPort}`));

        const serverClient: ServerClient = ServerClient.createInstance(httpServer, wsServer, dbConnection);

        return serverClient;
    }).catch(error => {
        console.log('Error: ', error);
        return null;
    });

}

function normalizePort(val: number | string): number | string | boolean {
    let port: number = (typeof val === 'string') ? parseInt(val, 10) : val;
    if (isNaN(port)) { return val; } else if (port >= 0) { return port; } else { return false; }
}

function onError(error: NodeJS.ErrnoException): void {
    if (error.syscall !== 'listen') { throw error; }
    let bind = (typeof httpPort === 'string') ? 'Pipe ' + httpPort : 'Port ' + httpPort;
    switch (error.code) {
        case 'EACCES':
            console.error(`${bind} requires elevated privileges`);
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(`${bind} is already in use`);
            process.exit(1);
            break;
        default:
            throw error;
    }
}

export const client = createServer();

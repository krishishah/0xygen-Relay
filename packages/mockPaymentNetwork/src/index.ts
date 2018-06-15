/** App entry point lives here */
import 'reflect-metadata';
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
import { useContainer as ormUseContainer, createConnection } from 'typeorm';

const host: string = process.env.PAYMENT_NETWORK_HOST || 'localhost';
const httpPort: number = normalizePort(process.env.PAYMENT_NETWORK_PORT || 3003) as number;
const wsPort: number = normalizePort(process.env.PAYMENT_NETWORK_WSPORT || 3004) as number;

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

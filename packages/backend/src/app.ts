import * as path from 'path';
import * as express from 'express';
import * as logger from 'morgan';
import * as bodyParser from 'body-parser';
import * as Web3 from 'web3';
import { Web3ProviderEngine, InjectedWeb3Subprovider, RedundantRPCSubprovider } from 'web3-provider-engine';
import { V0RestApiRouter } from './routes/rest';
import { ZeroEx, ZeroExConfig } from '0x.js';
import { Service } from 'typedi';
import { Container } from 'typedi/Container';
import { ZeroExClient } from './utils/zeroExClient';
import { server as WebSocketServer } from 'websocket';
import * as http from 'http';

// Creates and configures an ExpressJS web server.
@Service()
export class App {

    KOVAN_NETWORK_ID: number = 42;

    // ref to Express instance
    public express: express.Application;

    // ref to Express instance
    public wsServer: WebSocketServer;

    // Run configuration methods on the Express instance.
    constructor(private v0RestApiRouter: V0RestApiRouter) {
        this.express = express();
        this.wsServer = this.initialiseWebSocketServer();
        this.middleware();
        this.routes();
    }

    // Configer Web3 engine.
    public web3providerEngine: Web3ProviderEngine = () => {
        // Create a Web3 Provider Engine
        const engine = new Web3ProviderEngine();
        // Compose our Providers, order matters - use the RedundantRPCSubprovider to route all other requests
        engine.addProvider(new RedundantRPCSubprovider(['http://localhost:8545', 'https://kovan.infura.io/']));
        engine.start();

        console.log('Connected to Web3 Provider Engine');

        return engine;
    }

    // Set up ZeroEx instance
    public zeroEx = () => {
        const zeroExConfig: ZeroExConfig = {
            networkId: 50, // testrpc
        };
        // Instantiate 0x.js instance
        return ZeroExClient.createInstance(Web3ProviderEngine, zeroExConfig);
    }

    private initialiseWebSocketServer(): WebSocketServer {
        const server = http.createServer((request, response) => {
            console.log((new Date()) + ' Received request for ' + request.url);
            response.writeHead(404);
            response.end();
        });

        const wsServer = new WebSocketServer({
            httpServer: server,
            autoAcceptConnections: false,
        });

        return wsServer;
    }

    // Configure Express middleware.
    private middleware(): void {
        this.express.use(logger('dev'));
        this.express.use(bodyParser.json());
        this.express.use(bodyParser.urlencoded({ extended: false }));
    }

    // Configure API endpoints.
    private routes(): void {
        /* This is just to get up and running, and to make sure what we've got is
         * working so far. This function will change when we start to add more
         * API endpoints */
        let router = express.Router();

        this.express.use('/v0', this.v0RestApiRouter.router);
    }

}
import * as path from 'path';
import * as express from 'express';
import * as logger from 'morgan';
import * as bodyParser from 'body-parser';
import * as Web3 from 'web3';
import { V0RestApiRouter } from './routes/zeroExApi/rest';
import { ZeroEx, ZeroExConfig } from '0x.js';
import { Service } from 'typedi';
import { Container } from 'typedi/Container';
import { server as WebSocketServer } from 'websocket';
import * as http from 'http';
import { OffChainWebSocketHandler } from './routes/offChainApi/webSocket';
import * as cors from 'cors';
import { OffChainPaymentNetworkRestRoutes } from './routes/offChainApi/rest';
import { WebSocketHandler } from './routes/zeroExApi/webSocket';

// Creates and configures an ExpressJS web server.
@Service()
export class App {

    // ref to Express instance
    public express: express.Application;

    // ref to Express instance
    public zeroExWsServer: WebSocketServer;
    public offChainWsServer: WebSocketServer;

    // Run configuration methods on the Express instance.
    constructor(
        private v0RestApiRouter: V0RestApiRouter,
        private offChainRestApiRouter: OffChainPaymentNetworkRestRoutes, 
        private zeroExApiWsHandler: WebSocketHandler,
        private offChainApiWsHandler: OffChainWebSocketHandler
    ) {
        this.express = express();
        this.zeroExWsServer = this.initZeroExRelayerApiWebSocketServer();
        this.offChainWsServer = this.initOffChainApiWebSocketServer();
        this.middleware();
        this.routes();
    }

    private initZeroExRelayerApiWebSocketServer(): WebSocketServer {
        const server = http.createServer((request, response) => {
            console.log((new Date()) + ' Received request for ' + request.url);
            response.writeHead(404);
            response.end();
        });

        const wsServer = new WebSocketServer({
            httpServer: server,
            autoAcceptConnections: false
        });

        wsServer.on('request', this.zeroExApiWsHandler.webSocketConnectionHandler);

        return wsServer;
    }

    private initOffChainApiWebSocketServer(): WebSocketServer {
        const server = http.createServer((request, response) => {
            console.log((new Date()) + ' Received request for ' + request.url);
            response.writeHead(404);
            response.end();
        });

        const wsServer = new WebSocketServer({
            httpServer: server,
            autoAcceptConnections: false
        });

        wsServer.on('request', this.offChainApiWsHandler.webSocketConnectionHandler);

        return wsServer;
    }

    // Configure Express middleware.
    private middleware(): void {
        this.express.use(logger('dev'));
        this.express.use(bodyParser.json());
        this.express.use(bodyParser.urlencoded({ extended: false }));
        this.express.use(cors());
    }

    // Configure API endpoints.
    private routes(): void {
        /* This is just to get up and running, and to make sure what we've got is
         * working so far. This function will change when we start to add more
         * API endpoints */
        let router = express.Router();
        this.express.use('/off_chain', this.offChainRestApiRouter.router);
        this.express.use('/v0', this.v0RestApiRouter.router);
    }

}
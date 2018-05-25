import { Server } from 'http';
import { Connection } from 'typeorm/connection/Connection';
import { isNullOrUndefined } from 'util';
import { server as WebSocketServer } from 'websocket';

export class ServerClient {

    private static server: Server;
    private static dbConnection: Connection;
    private static zeroExWsServer: WebSocketServer;
    private static offChainWsServer: WebSocketServer;

    public static getHttpServerInstance(): Server {
        return this.server;
    }

    public static getZeroExRelayerApiWebSocketServerInstance(): Server {
        return this.zeroExWsServer;
    }

    public static getOffChainApiWebSocketServerInstance(): Server {
        return this.offChainWsServer;
    }

    public static getDbConnectionInstance(): Connection {
        return this.dbConnection;
    }

    public static createInstance(
        server: Server, 
        zeroExWsServer: WebSocketServer, 
        offChainWsServer: WebSocketServer,
        dbConnection: Connection
    ): ServerClient {
        if (isNullOrUndefined(this.server) 
            && isNullOrUndefined(this.zeroExWsServer) 
            && isNullOrUndefined(this.dbConnection)
            && isNullOrUndefined(this.offChainWsServer)
        ) {
            this.server = server;
            this.zeroExWsServer = zeroExWsServer;
            this.offChainWsServer = offChainWsServer;
            this.dbConnection = dbConnection;
        }
        return this;
    }

    private constructor() { }
}
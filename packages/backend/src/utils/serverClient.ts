import { Server } from 'http';
import { Connection } from 'typeorm/connection/Connection';
import { isNullOrUndefined } from 'util';
import { server as WebSocketServer } from 'websocket';

export class ServerClient {

    private static server: Server;
    private static dbConnection: Connection;
    private static wsServer: WebSocketServer;

    public static getHttpServerInstance(): Server {
        return this.server;
    }

    public static getWebSocketServerInstance(): Server {
        return this.wsServer;
    }

    public static getDbConnectionInstance(): Connection {
        return this.dbConnection;
    }

    public static createInstance(server: Server, wsServer: WebSocketServer, dbConnection: Connection): ServerClient {
        if (isNullOrUndefined(this.server) 
            && isNullOrUndefined(this.wsServer) 
            && isNullOrUndefined(this.dbConnection)
        ) {
            this.server = server;
            this.wsServer = wsServer;
            this.dbConnection = dbConnection;
        }
        return this;
    }

    private constructor() { }
}
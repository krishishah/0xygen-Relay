import { Server } from 'http';
import { Connection } from 'typeorm/connection/Connection';
import { isNullOrUndefined } from 'util';

export class ServerClient {

    private static server: Server;
    private static dbConnection: Connection;

    public static getHttpServerInstance(): Server {
        return this.server;
    }

    public static getDbConnectionInstance(): Connection {
        return this.dbConnection;
    }

    public static createInstance(server: Server, dbConnection: Connection): ServerClient {
        if (isNullOrUndefined(this.server) && isNullOrUndefined(this.dbConnection)) {
            this.server = server;
            this.dbConnection = dbConnection;
        }
        return this;
    }

    private constructor() { }
}
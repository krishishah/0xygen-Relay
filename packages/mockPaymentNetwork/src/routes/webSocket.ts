import * as http from 'http';
import { Service } from 'typedi';
import { PaymentNetworkService } from '../services/paymentNetworkService';
import { SerializerUtils } from '../utils/serialization';
import {
    connection as WebSocketConnection,
    server as WebSocketServer,
    request as WebSocketRequest
} from 'websocket';
import { 
    WebSocketMessage, 
    OrderbookUpdate, 
    OrderbookSnapshot, 
    Subscribe 
} from '../types/schemas';
import { Container } from 'typedi/Container';
import { App } from '../app';

interface WebSocketConnectionMetadata {
    socketConnection: WebSocketConnection;
    subscriptions: string[];
    subscriptionCount: number;
    subscriptionIdMap: Map<string, number>;
}

@Service()
export class WebSocketHandler {

    private connectionMetadataSet: Set<WebSocketConnectionMetadata>;

    /**
     * Initialize the Web Socket Handler
     */
    constructor( 
        private service: PaymentNetworkService, 
    ) { }

    webSocketConnectionHandler = (request: WebSocketRequest) => {
        let socketConnection: WebSocketConnection = request.accept();
        console.log('WS: Connection accepted');

        const connectionMetadata: WebSocketConnectionMetadata = {
            socketConnection,
            subscriptions: [],
            subscriptionCount: 0,
            subscriptionIdMap: new Map(),
        };

        // const keepAliveTimer = setInterval(() => {
        //     if (socketConnection.connected) {
        //         socketConnection.ping({ type: 'keepalive', channel: 'keepalive', payload: {} });
        //     } else {
        //         clearInterval(keepAliveTimer);
        //         if (this.connectionMetadataSet.has(connectionMetadata)) {
        //             console.log('Found a stale webSocket connection, removing');
        //             this.closeWebSocketConnection(connectionMetadata);
        //         }
        //     }
        // }, 1000);

        // socketConnection.on('message', message => 
        //     this.onMessageFromClientSocket(message, connectionMetadata));
        // socketConnection.on('close', (reasonCode, description) => 
        //     this.closeWebSocketConnection(reasonCode, description));
        // socketConnection.on('error', err => 
        //     console.log('error', JSON.stringify(err)));

        this.connectionMetadataSet.add(connectionMetadata);
    }

}
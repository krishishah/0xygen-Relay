import * as http from 'http';
import { Service } from 'typedi';
import { RestService } from '../services/restService';
import { SerializerUtils } from '../utils/serialization';
import { EventPubSub } from '../services/eventPubSub';
import {
    connection as WebSocketConnection,
    server as WebSocketServer,
    request as WebSocketRequest
} from 'websocket';
import { 
    OrderEvent, 
    OrderAdded, 
    OrderUpdated, 
    ORDER_UPDATED, 
    ORDER_ADDED 
} from '../types/events';
import { 
    WebSocketMessage, 
    OrderbookUpdate, 
    OrderbookSnapshot, 
    Subscribe 
} from '../types/schemas';
import { ServerClient } from '../utils/serverClient';
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
        private restService: RestService, 
        private pubSubClient: EventPubSub
    ) {
        this.connectionMetadataSet = new Set();
        this.init();
    }

    webSocketConnectionHandler = (request: WebSocketRequest) => {
        let socketConnection: WebSocketConnection = request.accept();
        console.log('WS: Connection accepted');

        const connectionMetadata: WebSocketConnectionMetadata = {
            socketConnection,
            subscriptions: [],
            subscriptionCount: 0,
            subscriptionIdMap: new Map(),
        };

        const keepAliveTimer = setInterval(() => {
            if (socketConnection.connected) {
                socketConnection.ping({ type: 'keepalive', channel: 'keepalive', payload: {} });
            } else {
                clearInterval(keepAliveTimer);
                if (this.connectionMetadataSet.has(connectionMetadata)) {
                    console.log('Found a stale webSocket connection, removing');
                    this.closeWebSocketConnection(connectionMetadata);
                }
            }
        }, 1000);

        socketConnection.on('message', message => 
            this.onMessageFromClientSocket(message, connectionMetadata));
        socketConnection.on('close', (reasonCode, description) => 
            this.closeWebSocketConnection(reasonCode, description));
        socketConnection.on('error', err => 
            console.log('error', JSON.stringify(err)));

        this.connectionMetadataSet.add(connectionMetadata);
    }

    private closeWebSocketConnection(
        connectionMetadata: WebSocketConnectionMetadata, 
        reasonCode?: number, 
        description?: string
    ) {
        console.log('WS: Peer disconnected');
        this.connectionMetadataSet.delete(connectionMetadata);
    }

    // tslint:disable-next-line:no-any
    private onMessageFromClientSocket(message: any, connectionMetadata: WebSocketConnectionMetadata) {
        if (message.type === 'utf8' && message.utf8Data !== undefined) {
            const parsedMessage = JSON.parse(message.utf8Data) as WebSocketMessage<Subscribe>;
            console.log('WS: Received Message: ' + parsedMessage.type);

            if (parsedMessage.type === 'subscribe') {

                const socketConnection = connectionMetadata.socketConnection;
                const snapshotNeeded = parsedMessage.payload.snapshot;
                const baseTokenAddress = parsedMessage.payload.baseTokenAddress;
                const quoteTokenAddress = parsedMessage.payload.quoteTokenAddress;
                const requestId = parsedMessage.requestId;
    
                connectionMetadata.subscriptions.push(`${baseTokenAddress}-${quoteTokenAddress}`);
    
                if (snapshotNeeded && socketConnection !== undefined) {
                    this.restService.getOrderBook(
                        baseTokenAddress, 
                        quoteTokenAddress
                    ).then(
                        orderbook => {
                            const returnMessage: WebSocketMessage<OrderbookSnapshot> = {
                                type: 'snapshot',
                                channel: 'orderbook',
                                requestId,
                                payload: SerializerUtils.TokenPairOrderbooktoJSON(orderbook)
                            };
                            socketConnection.sendUTF(JSON.stringify(returnMessage));
                        }
                    );
                }
            }
        }
    }

    // TODO: Implement special logic for Order fills and cancellations
    private handleOrderbookUpdate(data: OrderEvent<OrderAdded | OrderUpdated>) { 
        const { baseTokenAddress, quoteTokenAddress } = data.payload;
        const subscriptionChannel = `${baseTokenAddress}-${quoteTokenAddress}`;
        
        this.connectionMetadataSet.forEach(activeConnection => {
            if (activeConnection.subscriptions.find(sub => sub === subscriptionChannel)) {
                const requestId = activeConnection.subscriptionIdMap.get(subscriptionChannel) || 0;
                const message: WebSocketMessage<OrderbookUpdate> = {
                    type: 'update',
                    channel: 'orderbook',
                    requestId,
                    payload: SerializerUtils.SignedOrdertoJSON(data.payload.order),
                };
                activeConnection.socketConnection.sendUTF(message);
            }
        });
    }

    /**
     * Take each handler, and attach to one of the Web Socket's
     * listeners.
     */
    private init() {
        this.pubSubClient.subscribe(ORDER_UPDATED, this.handleOrderbookUpdate.bind(this));
        this.pubSubClient.subscribe(ORDER_ADDED, this.handleOrderbookUpdate.bind(this));
    }
}
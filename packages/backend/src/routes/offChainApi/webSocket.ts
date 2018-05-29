import * as http from 'http';
import { Service } from 'typedi';
import { SerializerUtils } from '../../utils/serialization';
import { EventPubSub } from '../../services/eventPubSub';
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
    ORDER_ADDED, 
    ORDER_REMOVED,
    OrderRemoved,
    OFF_CHAIN_ORDER_ADDED,
    OffChainOrderAdded
} from '../../types/events';
import { 
    OrderbookWebSocketMessage, 
    OrderbookUpdate, 
    OrderbookSnapshot, 
    OrderbookSubscribe, 
    OffChainOrderbookUpdate,
    OffChainOrderbookSnapshot
} from '../../types/schemas';
import { Container } from 'typedi/Container';
import { App } from '../../app';
import { OffChainOrderService } from '../../services/offChainOrderService';

interface WebSocketConnectionMetadata {
    socketConnection: WebSocketConnection;
    subscriptions: string[];
    subscriptionCount: number;
    subscriptionIdMap: Map<string, number>;
}

@Service()
export class OffChainWebSocketHandler {

    private connectionMetadataSet: Set<WebSocketConnectionMetadata>;

    /**
     * Initialize the Web Socket Handler
     */
    constructor( 
        private orderService: OffChainOrderService, 
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
        // tslint:disable-next-line:align
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

    private async onMessageFromClientSocket(
        // tslint:disable-next-line:no-any
        message: any, 
        connectionMetadata: WebSocketConnectionMetadata
    ): Promise<void> {
        if (message.type === 'utf8' && message.utf8Data !== undefined) {
            const parsedMessage = JSON.parse(message.utf8Data) as OrderbookWebSocketMessage<OrderbookSubscribe>;
            console.log('WS: Received Message: ' + parsedMessage.type);

            if (parsedMessage.type === 'subscribe') {

                const socketConnection = connectionMetadata.socketConnection;
                const snapshotNeeded = parsedMessage.payload.snapshot;
                const baseTokenAddress = parsedMessage.payload.baseTokenAddress;
                const quoteTokenAddress = parsedMessage.payload.quoteTokenAddress;
                const requestId = parsedMessage.requestId;
    
                connectionMetadata.subscriptions.push(`${baseTokenAddress}-${quoteTokenAddress}`);
    
                if (snapshotNeeded && socketConnection !== undefined) {
                    this.orderService.getOrderbook(
                        baseTokenAddress, 
                        quoteTokenAddress
                    ).then(
                        orderbook => {
                            const returnMessage: OrderbookWebSocketMessage<OffChainOrderbookSnapshot> = {
                                type: 'snapshot',
                                channel: 'orderbook',
                                requestId,
                                payload: SerializerUtils.OffChainTokenPairOrderbooktoJSON(orderbook)
                            };
                            socketConnection.sendUTF(JSON.stringify(returnMessage));
                        }
                    );
                }
            }
        }
    }

    private handleOrderbookUpdate(
        data: OrderEvent<OffChainOrderAdded>
    ) { 
        const { makerTokenAddress, takerTokenAddress } = data.payload.order;
        const subChannels = [
                             `${makerTokenAddress}-${takerTokenAddress}`, 
                             `${takerTokenAddress}-${makerTokenAddress}`
                            ];
        
        console.log(`Received OrderEvent of type: ${data.type} with data:\n${JSON.stringify(data)}`);

        this.connectionMetadataSet.forEach(activeConnection => {
            if (activeConnection.subscriptions.find(sub => sub === subChannels[0] || sub === subChannels[1])) {
                
                const requestId = activeConnection.subscriptionIdMap.get(subChannels[0]) 
                                  || activeConnection.subscriptionIdMap.get(subChannels[1])
                                  || 0;

                const orderAddedMessage: OrderbookWebSocketMessage<OffChainOrderbookUpdate> = {
                    type: 'update',
                    channel: 'orderbook',
                    requestId,
                    payload: SerializerUtils.OffChainSignedOrdertoJSON(data.payload.order),
                };
                
                activeConnection.socketConnection.sendUTF(JSON.stringify(orderAddedMessage));
            }
        });
    }

    /**
     * Take each handler, and attach to one of the Web Socket's
     * listeners.
     */
    private init() {
        this.pubSubClient.subscribe(OFF_CHAIN_ORDER_ADDED, this.handleOrderbookUpdate.bind(this));
    }
}
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
    PaymentNetworkSubscribe, 
    PaymentNetworkSubscrptionSuccess, 
    PaymentNetworkUpdate
} from '../types/schemas';
import { Container } from 'typedi/Container';
import { App } from '../app';
import { EventPubSub } from '../services/eventPubSub';
import { 
    OrderEvent, 
    OrderUpdate, 
    ORDER_UPDATED
} from '../types/events';

interface WebSocketConnectionMetadata {
    socketConnection: WebSocketConnection;
    subscriptions: string[];
    subscriptionCount: number;
    subscriptionIdMap: Map<string, number>;
}

const GENESIS_ADDRESS = '0x0000000000000000000000000000000000000000';

@Service()
export class WebSocketHandler {

    private connectionMetadataSet: Set<WebSocketConnectionMetadata>;

    /**
     * Initialize the Web Socket Handler
     */
    constructor( 
        private orderService: PaymentNetworkService, 
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
            const parsedMessage = JSON.parse(message.utf8Data) as WebSocketMessage<PaymentNetworkSubscribe>;
            console.log('WS: Received Message: ' + parsedMessage.type);

            if (parsedMessage.type === 'subscribe') {

                const socketConnection = connectionMetadata.socketConnection;
                const baseTokenAddress = parsedMessage.payload.baseTokenAddress;
                const quoteTokenAddress = parsedMessage.payload.quoteTokenAddress;
                const requestId = parsedMessage.requestId;
    
                connectionMetadata.subscriptions.push(`${baseTokenAddress}-${quoteTokenAddress}`);
    
                if (socketConnection !== undefined) {
                    const returnMessage: WebSocketMessage<PaymentNetworkSubscrptionSuccess> = {
                        type: 'success',
                        requestId,
                        payload: parsedMessage.payload
                    };
                    socketConnection.sendUTF(JSON.stringify(returnMessage));
                }
            }
        }
    }

    private handleOrderbookUpdate(
        data: OrderEvent<OrderUpdate>
    ) { 
        const { makerTokenAddress, takerTokenAddress } = data.payload.order;

        // Nodes wish to subscribe to all token pairs specify a GENESIS_ADDRESS-GENESIS_ADDRESS payload
        const subChannels = [
                             `${makerTokenAddress}-${takerTokenAddress}`, 
                             `${takerTokenAddress}-${makerTokenAddress}`,
                             `${GENESIS_ADDRESS}-${GENESIS_ADDRESS}`
                            ];
        
        console.log(`Received OrderEvent of type: ${data.type} with data:\n${JSON.stringify(data)}`);

        this.connectionMetadataSet.forEach(activeConnection => {
            if (activeConnection.subscriptions.find(
                    sub => sub === subChannels[0] 
                    || sub === subChannels[1] 
                    || sub === subChannels[2]
                )
            ) {
                
                const requestId = activeConnection.subscriptionIdMap.get(subChannels[0]) 
                                  || activeConnection.subscriptionIdMap.get(subChannels[1])
                                  || 0;

                const payload: PaymentNetworkUpdate = {
                    signedOrder: SerializerUtils.SignedOrdertoJSON(data.payload.order),
                    remainingFillableMakerTokenAmount: data.payload.remainingFillableMakerAmount.toFixed(),
                    remainingFillableTakerTokenAmount: data.payload.remainingFillableTakerAmount.toFixed()
                };

                const orderAddedMessage: WebSocketMessage<PaymentNetworkUpdate> = {
                    type: data.type,
                    requestId,
                    payload,
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
        this.pubSubClient.subscribe(ORDER_UPDATED, this.handleOrderbookUpdate.bind(this));
    }

}
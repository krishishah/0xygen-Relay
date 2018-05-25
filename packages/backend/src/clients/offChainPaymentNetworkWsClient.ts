import { Service } from 'typedi';
import { PAYMENT_NETWORK_WS_HOST } from '../index';
import {
    connection as WebSocketConnection,
    server as WebSocketServer,
    request as WebSocketRequest
} from 'websocket';
import { 
    OrderbookWebSocketMessage, 
    OrderbookSubscribe, 
    TokenPair, 
    OrderbookUpdate, 
    PaymentNetworkWebSocketMessage, 
    PaymentNetworkSubscrptionSuccess, 
    PaymentNetworkUpdate, 
    PaymentNetworkSubscribe
} from '../types/schemas';
import { OffChainOrderService } from '../services/offChainOrderService';

var W3CWebSocket = require('websocket').w3cwebsocket;

const SUBSCRIPTION_ID: number = 1;

const GENESIS_TOKEN_PAIR = {
    base: '0x0000000000000000000000000000000000000000',
    quote: '0x0000000000000000000000000000000000000000'
};

@Service()
export class OffChainPaymentNetworkWsClient {
    
    private webSocket;

    constructor(private service: OffChainOrderService) {
        this.init();    
    }

    init = async () => {
        if (!this.webSocket || !(this.webSocket.readyState === this.webSocket.OPEN)) {
            this.webSocket = new W3CWebSocket(
                PAYMENT_NETWORK_WS_HOST
            );

            console.log('Connected client on port %s.', PAYMENT_NETWORK_WS_HOST);

            this.webSocket.onopen = async (event: Event) => {
                await this.subscribe();
            };
                
            this.webSocket.onmessage = async (message: MessageEvent) => {
                await this.handleWebSocketMessage(message);
            };
    
            this.webSocket.onclose = async () => {
                console.log('Relayer disconnected, attempting to reconnect');
                await this.init();
            };
        }
    }
  
    // tslint:disable-next-line:no-any
    send = async (event: string, payload: any) => {
        if (!(this.webSocket.readyState === this.webSocket.OPEN)) {
            await this.init();
        }
        this.webSocket.send(payload);
        console.log('sent message: %s', payload);   
    }

    handleWebSocketMessage = async (message: MessageEvent) => {
        console.log('[client](message): %s', message.data);   
        if (message !== undefined) {
            const parsedMessage = JSON.parse(message.data);
            await this.handlePaymentNetworkEvent(parsedMessage);
        }
    }

    handlePaymentNetworkEvent = async (paymentNetworkEvent) => {
        switch (paymentNetworkEvent.type) {
            case 'success':
                const paymentNetworkSubscriptionSuccessEvent 
                    = paymentNetworkEvent as PaymentNetworkWebSocketMessage<PaymentNetworkSubscrptionSuccess>;
                console.log('got a success payment network event', paymentNetworkSubscriptionSuccessEvent);
                return;
            case 'fill':
                const paymentNetworkFillEvent 
                    = paymentNetworkEvent as PaymentNetworkWebSocketMessage<PaymentNetworkUpdate>;
                console.log('got a update payment network event', paymentNetworkFillEvent);
                await this.service.onPaymentNetworkUpdate(paymentNetworkFillEvent.payload);
                return;
            case 'cancel':
                const paymentNetworkCancelEvent 
                    = paymentNetworkEvent as PaymentNetworkWebSocketMessage<PaymentNetworkUpdate>;
                console.log('got a update payment network event', paymentNetworkCancelEvent);
                await this.service.onPaymentNetworkUpdate(paymentNetworkCancelEvent.payload);
                return;
            case 'close':
                console.log('got a close payment network event, reopening channel', paymentNetworkEvent);
                this.init();
                return;
            case 'error':
                console.log('got an error payment network event, reopening channel', paymentNetworkEvent);
                this.init();
                return;
            default:
                console.log('unrecognized payment network event', paymentNetworkEvent);
                return;
        }
    }

    subscribe = async () => {
        // Temporarily reuse current requestId for new subscriptions
        const subscribeMessage: PaymentNetworkWebSocketMessage<PaymentNetworkSubscribe> = {
            type: 'subscribe',
            requestId: SUBSCRIPTION_ID,
            payload: {
                baseTokenAddress: GENESIS_TOKEN_PAIR.base,
                quoteTokenAddress: GENESIS_TOKEN_PAIR.quote
            }
        };

        await this.send('message', JSON.stringify(subscribeMessage));
    }
}
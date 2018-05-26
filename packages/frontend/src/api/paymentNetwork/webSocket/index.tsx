import * as React from 'react';
import { RELAYER_ZERO_EX_WS_URL, PAYMENT_NETWORK_WS_URL } from '../../../config';
import { 
    PaymentNetworkWebSocketMessage, 
    PaymentNetworkUpdate, 
    TokenPair, 
    PaymentNetworkSubscribe 
} from '../../../types';
import { Token } from '0x.js';
import { SerializerUtils } from '../../../utils';

interface Props {
    onUpdate: (update: PaymentNetworkWebSocketMessage<PaymentNetworkUpdate>, tokenPair: TokenPair) => void;
}

interface State {
    subscriptionCount: number;
    subscriptionIdMap: Map<number, TokenPair>;
}

export class PaymentNetworkWebSocketClient extends React.Component<Props, State> {
    webSocket: WebSocket;
  
    constructor(props: Props) {
        super(props);

        this.state = {
            subscriptionCount: 0,
            subscriptionIdMap: new Map<number, TokenPair>()
        };
    }

    async componentDidMount() {
        await this.initialiseConnection();
    }

    initialiseConnection = async () => {
        if (!this.webSocket) {
            this.webSocket = new WebSocket(PAYMENT_NETWORK_WS_URL);
        }

        if (!(this.webSocket.readyState === this.webSocket.OPEN)) {
            console.log('Connected client on port %s.', PAYMENT_NETWORK_WS_URL);

            this.webSocket.onopen = async (event: Event) => {
                this.state.subscriptionIdMap.forEach(async (v: TokenPair, k: number, map) => {
                    await this.subscribe(v, k);
                });
            };
                
            this.webSocket.onmessage = async (message: MessageEvent) => await this.handleWebSocketMessage(message);

            this.webSocket.onclose = () => {
                console.log('Relayer disconnected, attempting to reconnect');
                this.initialiseConnection();
            };
        }
    }
  
    send = async (event: string, payload: any) => {
        await this.initialiseConnection();
        this.webSocket.send(payload);
        console.log('sent message: %s', payload);   
    }

    handleWebSocketMessage = async (message: MessageEvent) => {
        console.log('[client](message): %s', message.data);   
        if (message !== undefined) {
            const parsedMessage = JSON.parse(message.data);
            await this.handleOrderbookEvent(parsedMessage);
        }
    }

    handleOrderbookEvent = async (paymentNetworkEvent) => {
        switch (paymentNetworkEvent.type) {
            case 'fill':
                const fillEvent = paymentNetworkEvent as PaymentNetworkWebSocketMessage<PaymentNetworkUpdate>;
                console.log('got a fill orderbook event', fillEvent);
                await this.props.onUpdate(
                    fillEvent, 
                    this.state.subscriptionIdMap.get(fillEvent.requestId) as TokenPair
                );
                return;
            case 'cancel':
                const cancelEvent = paymentNetworkEvent as PaymentNetworkWebSocketMessage<PaymentNetworkUpdate>;
                console.log('got a cancel orderbook event', paymentNetworkEvent);
                await this.props.onUpdate(
                    paymentNetworkEvent,
                    this.state.subscriptionIdMap.get(paymentNetworkEvent.requestId) as TokenPair
                );
                return;
            case 'close':
                console.log('got a close orderbook event, reopening channel', paymentNetworkEvent);
                this.initialiseConnection();
                return;
            case 'error':
                console.log('got an error orderbook event, reopening channel', paymentNetworkEvent);
                this.initialiseConnection();
                return;
            default:
                console.log('unrecognized orderbook event', paymentNetworkEvent);
                return;
        }
    }

    subscribe = async (tokenPair: TokenPair, requestId?: number) => {
        // Temporarily reuse current requestId for new subscriptions
        const subscriptionCount = requestId ? requestId : this.state.subscriptionCount;

        const subscribeMessage: PaymentNetworkWebSocketMessage<PaymentNetworkSubscribe> = {
            type: 'subscribe',
            requestId: subscriptionCount,
            payload: {
                baseTokenAddress: tokenPair.base.address,
                quoteTokenAddress: tokenPair.quote.address,
            }
        };

        await this.setState({ 
            subscriptionCount: subscriptionCount,
            subscriptionIdMap: this.state.subscriptionIdMap.set(subscriptionCount, tokenPair)
        });

        await this.send('message', JSON.stringify(subscribeMessage));
    }

    closeConnection = async () => {
        await this.webSocket.close();
    }

    componentWillUnmount() {
        this.closeConnection();
    }

    render() {
        return null;
    }
}
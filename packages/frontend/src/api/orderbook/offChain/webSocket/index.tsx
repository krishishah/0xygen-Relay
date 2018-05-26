import * as React from 'react';
import { 
    TokenPair, 
    PaymentNetworkUpdate, 
    WebSocketMessage, 
    OffChainOrderbookUpdate,
    OffChainOrderbookSnapshot,
    OrderbookSubscribe
} from '../../../../types';
import { RELAYER_ZERO_EX_WS_URL } from '../../../../config';

interface Props {
    onSnapshot: (update: WebSocketMessage<OffChainOrderbookSnapshot>, tokenPair: TokenPair) => void;
    onUpdate: (update: WebSocketMessage<OffChainOrderbookUpdate>, tokenPair: TokenPair) => void;
}

interface State {
    subscriptionCount: number;
    subscriptionIdMap: Map<number, TokenPair>;
}

export class OffChainRelayerWebSocketChannel extends React.Component<Props, State> {
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
            this.webSocket = new WebSocket(RELAYER_ZERO_EX_WS_URL);
        }

        if (!(this.webSocket.readyState === this.webSocket.OPEN)) {
            console.log('Connected client on port %s.', RELAYER_ZERO_EX_WS_URL);

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

    handleOrderbookEvent = async (orderbookEvent) => {
        switch (orderbookEvent.type) {
            case 'snapshot':
                const orderbookSnapshotEvent = orderbookEvent as WebSocketMessage<OffChainOrderbookSnapshot>;
                console.log('got a snapshot orderbook event', orderbookSnapshotEvent);
                await this.props.onSnapshot(
                    orderbookSnapshotEvent, 
                    this.state.subscriptionIdMap.get(orderbookSnapshotEvent.requestId) as TokenPair
                );
                return;
            case 'update':
                const orderbookUpdateEvent = orderbookEvent as WebSocketMessage<OffChainOrderbookUpdate>;
                console.log('got a update orderbook event', orderbookUpdateEvent);
                await this.props.onUpdate(
                    orderbookUpdateEvent,
                    this.state.subscriptionIdMap.get(orderbookUpdateEvent.requestId) as TokenPair
                );
                return;
            case 'close':
                console.log('got a close orderbook event, reopening channel', orderbookEvent);
                this.initialiseConnection();
                return;
            case 'error':
                console.log('got an error orderbook event, reopening channel', orderbookEvent);
                this.initialiseConnection();
                return;
            default:
                console.log('unrecognized orderbook event', orderbookEvent);
                return;
        }
    }

    subscribe = async (tokenPair: TokenPair, requestId?: number) => {
        // Temporarily reuse current requestId for new subscriptions
        const subscriptionCount = requestId ? requestId : this.state.subscriptionCount;

        const subscribeMessage: WebSocketMessage<OrderbookSubscribe> = {
            type: 'subscribe',
            channel: 'orderbook',
            requestId: subscriptionCount,
            payload: {
                baseTokenAddress: tokenPair.base.address,
                quoteTokenAddress: tokenPair.quote.address,
                snapshot: true,
                limit: 100
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
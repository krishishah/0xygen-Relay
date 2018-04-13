import { ZeroEx } from '0x.js/lib/src/0x';
import { Web3Provider, ZeroExConfig, Token } from '0x.js/lib/src/types';
import {
    OrderbookChannel,
    OrderbookChannelHandler,
    OrderbookChannelSubscriptionOpts,
    WebSocketOrderbookChannel,
} from '@0xproject/connect';
import { SimpleOrderbookChannelHandler } from 'src/api/webSocket/simpleOrderbookHandler';

export class RelayerWebSocketClient {
    
    private zeroEx: ZeroEx;
    private orderbookChannel: OrderbookChannel;

    constructor(provider: Web3Provider, config: ZeroExConfig, relayerWsUrl: string) {
        this.zeroEx = new ZeroEx(provider, config);
        this.orderbookChannel = new WebSocketOrderbookChannel(relayerWsUrl);
    }

    watchTokenPairOrderbook(baseToken: Token, quoteToken: Token) {
        // Generate OrderbookChannelSubscriptionOpts for watching the Base/Quote orderbook
        const tokenPairSubscriptionOpts: OrderbookChannelSubscriptionOpts = {
            baseTokenAddress: baseToken.address,
            quoteTokenAddress: quoteToken.address,
            snapshot: true,
            limit: 20,
        };

        // Create a OrderbookChannelHandler to handle messages from the relayer
        const orderbookChannelHandler: OrderbookChannelHandler = new SimpleOrderbookChannelHandler(this.zeroEx);

        // Subscribe to the relayer
        this.orderbookChannel.subscribe(tokenPairSubscriptionOpts, orderbookChannelHandler);
        console.log(`Listening for ${baseToken.symbol}/${quoteToken.symbol} orderbook...`);
    }

    unwatchCurrentTokenPairOrderbook() {
        this.orderbookChannel.close();
    }

}
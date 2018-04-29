import { ECSignature, SignedOrder } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils/lib/configured_bignumber';

type Address = string;

export interface SignedOrderSchema {
    ecSignature: ECSignature;
    maker: string;
    taker: string;
    makerFee: string;
    takerFee: string;
    makerTokenAmount: string;
    takerTokenAmount: string;
    makerTokenAddress: string;
    takerTokenAddress: string;
    salt: string;
    exchangeContractAddress: string;
    feeRecipient: string;
    expirationUnixTimestampSec: string;
}

export interface TokenPairOrderbookSchema {
    bids: SignedOrderSchema[];
    asks: SignedOrderSchema[];
}

export interface WebSocketMessage<T extends OrderbookUpdate | Subscribe | OrderbookSnapshot> {
    type: string;
    channel: string;
    requestId: number;
    payload: T;
}

export type OrderbookUpdate = SignedOrderSchema;

export interface Subscribe {
    baseTokenAddress: string;
    quoteTokenAddress: string;
    snapshot: boolean;
    limit: number;
}

export type OrderbookSnapshot = TokenPairOrderbookSchema;

export interface EnrichedSignedOrder {
    signedOrder: SignedOrder;
    remainingMakerTokenAmount: BigNumber;
    remainingTakerTokenAmount: BigNumber;
}
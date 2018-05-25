import { ECSignature, SignedOrder } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils/lib/configured_bignumber';
import { Token } from '0x.js';

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

export interface TokenPairOrderbook {
    bids: SignedOrder[];
    asks: SignedOrder[];
}

export interface OrderbookWebSocketMessage<T extends OrderbookUpdate | OrderbookSubscribe | OrderbookSnapshot> {
    type: string;
    channel: string;
    requestId: number;
    payload: T;
}

export type OrderbookUpdate = SignedOrderSchema;

export interface OrderbookSubscribe {
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

/////////////////////////////////////// Off-Chain Schemas /////////////////////////////////////////

export interface OffChainOrder {
    maker: string;
    taker: string;
    makerTokenAmount: BigNumber;
    takerTokenAmount: BigNumber;
    makerTokenAddress: string;
    takerTokenAddress: string;
    salt: BigNumber;
    expirationUnixTimestampSec: BigNumber;
}

export interface OffChainSignedOrder extends OffChainOrder {
    ecSignature: ECSignature;
}

export interface OffChainSignedOrderSchema {
    ecSignature: ECSignature;
    maker: string;
    taker: string;
    makerTokenAmount: string;
    takerTokenAmount: string;
    makerTokenAddress: string;
    takerTokenAddress: string;
    salt: string;
    expirationUnixTimestampSec: string;
}

export interface OffChainEnrichedSignedOrder {
    signedOrder: OffChainSignedOrder;
    remainingMakerTokenAmount: BigNumber;
    remainingTakerTokenAmount: BigNumber;
}

export interface OffChainOrderRelevantState {
    filledTakerTokenAmount: BigNumber;
    cancelledTakerTokenAmount: BigNumber;
    remainingFillableMakerTokenAmount: BigNumber;
    remainingFillableTakerTokenAmount: BigNumber;
}

export interface TokenSchema {
    address: string;
    balance: string;
}

export interface TokenBalancesSchema {
    userAddress: string;
    tokenBalances: TokenSchema[];
}

export interface OffChainTokenPairOrderbookSchema {
    bids: OffChainSignedOrderSchema[];
    asks: OffChainSignedOrderSchema[];
}

export interface OffChainTokenPairOrderbook {
    bids: OffChainSignedOrder[];
    asks: OffChainSignedOrder[];
}

export type TokenBalances = Map<string, BigNumber>;

export interface TokenPair {
    base: Token;
    quote: Token;
}

export interface PaymentNetworkWebSocketMessage <T extends PaymentNetworkWebSocketMessageTypes > {
    type: string;
    requestId: number;
    payload: T;
}

export type PaymentNetworkWebSocketMessageTypes = 
                    PaymentNetworkUpdate | PaymentNetworkSubscribe | PaymentNetworkSubscrptionSuccess;

export interface PaymentNetworkUpdate {
    signedOrder: OffChainSignedOrderSchema;
    remainingFillableMakerTokenAmount: string;
    remainingFillableTakerTokenAmount: string;
}

export interface PaymentNetworkSubscrptionSuccess {
    baseTokenAddress: string;
    quoteTokenAddress: string;
}

export interface PaymentNetworkSubscribe {
    baseTokenAddress: string;
    quoteTokenAddress: string;
}

export interface OffChainSignedOrderStatus {
    orderHash: string;
    isValid: boolean;
    signedOrder: OffChainSignedOrder;
    remainingFillableMakerTokenAmount: BigNumber;
    remainingFillableTakerTokenAmount: BigNumber;
}

export interface OffChainSignedOrderStatusSchema {
    orderHash: string;
    isValid: boolean;
    signedOrder: OffChainSignedOrderSchema;
    remainingFillableMakerTokenAmount: string;
    remainingFillableTakerTokenAmount: string;
}

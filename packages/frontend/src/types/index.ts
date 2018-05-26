import { Token, ECSignature, SignedOrder } from '0x.js';
import { BigNumber } from 'bignumber.js';

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

export interface OrderRelevantStateSchema {
    makerBalance: string;
    makerProxyAllowance: string;
    makerFeeBalance: string;
    makerFeeProxyAllowance: string;
    filledTakerTokenAmount: string;
    cancelledTakerTokenAmount: string;
    remainingFillableMakerTokenAmount: string;
    remainingFillableTakerTokenAmount: string;
}

export interface TokenPair {
    base: Token;
    quote: Token;
}

export interface EnrichedSignedOrder {
    signedOrder: SignedOrder;
    remainingMakerTokenAmount: BigNumber;
    remainingTakerTokenAmount: BigNumber;
}

export interface TokenPairOrderbook {
    bids: SignedOrder[];
    asks: SignedOrder[];
}

export interface EnrichedTokenPairOrderbook {
    bids: EnrichedSignedOrder[];
    asks: EnrichedSignedOrder[];
}

export type OrderbookWsMessageType 
    = OrderbookUpdate | OrderbookSubscribe | OrderbookSnapshot | OffChainOrderbookUpdate | OffChainOrderbookSnapshot;

export interface WebSocketMessage<T extends OrderbookWsMessageType> {
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

///////////////////////////////////////////// OFF CHAIN SCHEMA ///////////////////////////////////////////////////

export type OffChainOrderbookUpdate = OffChainSignedOrderSchema;

export type OffChainOrderbookSnapshot = OffChainTokenPairOrderbookSchema;

export interface OffChainTokenSchema {
    address: string;
    balance: string;
}

export interface OffChainTokenBalancesSchema {
    userAddress: string;
    tokenBalances: OffChainTokenSchema[];
}

export interface OffChainTokenBalances {
    userAddress: string;
    tokenBalances: TokenBalances;
}

export type TokenBalances = Map<string, BigNumber>;

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

export interface TokenPair {
    base: Token;
    quote: Token;
}

export interface PaymentNetworkWebSocketMessage <T extends PaymentNetworkWebSocketMessageTypes> {
    type: string;
    requestId: number;
    payload: T;
}

export type PaymentNetworkWebSocketMessageTypes = 
                    PaymentNetworkUpdate | PaymentNetworkSubscribe | PaymentNetworkSubscriptionSuccess;

export interface PaymentNetworkUpdate {
    signedOrder: OffChainSignedOrderSchema;
    remainingFillableMakerTokenAmount: string;
    remainingFillableTakerTokenAmount: string;
}

export interface PaymentNetworkSubscriptionSuccess {
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
import { ECSignature } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils/lib/configured_bignumber';
import { Token } from '0x.js';

type Address = string;

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

export interface TokenPairOrderbookSchema {
    bids: OffChainSignedOrderSchema[];
    asks: OffChainSignedOrderSchema[];
}

export interface WebSocketMessage<T extends WebSocketMessageTypes> {
    type: string;
    requestId: number;
    payload: T;
}

export type WebSocketMessageTypes = 
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

export interface EnrichedSignedOrder {
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

export interface OrderFilledQuantities {
    filledMakerAmount: BigNumber;
    filledTakerAmount: BigNumber;
}

export interface OrderFilledQuantitiesSchema {
    filledMakerAmount: string;
    filledTakerAmount: string;
}

export interface TokenBalancesSchema {
    userAddress: string;
    tokenBalances: TokenSchema[];
}

export type TokenBalances = Map<string, BigNumber>;

export interface OffChainFillOrderSchema {
    signedOrder: OffChainSignedOrderSchema;
    takerAddress: string;
    takerFillAmount: string;
}

export interface OffChainFillOrderRequestSchema extends OffChainFillOrderSchema {
    ecSignature: ECSignature;
}

export interface OffChainFillOrder {
    signedOrder: OffChainSignedOrder;
    takerAddress: string;
    takerFillAmount: BigNumber;
}

export interface OffChainFillOrderRequest extends OffChainFillOrder {
    ecSignature: ECSignature;
}

export interface OffChainBatchFillOrder {
    signedOrders: OffChainSignedOrder[];
    takerAddress: string;
    takerFillAmount: BigNumber;
}

export interface OffChainBatchFillOrderRequest extends OffChainBatchFillOrder {
    ecSignature: ECSignature;
}

export interface OffChainBatchFillOrderSchema {
    signedOrders: OffChainSignedOrderSchema[];
    takerAddress: string;
    takerFillAmount: string;
}

export interface OffChainBatchFillOrderRequestSchema extends OffChainBatchFillOrderSchema {
    ecSignature: ECSignature;
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

export interface TokenPair {
    base: Token;
    quote: Token;
}
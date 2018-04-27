import { BigNumber } from 'bignumber.js';
import { SignedOrder, Token, OrderState, ExchangeContractErrs } from '0x.js';
import { OrderRelevantState } from '0x.js/lib/src/types';

// Event types
export const ORDER_UPDATED = 'ORDER_UPDATED';
export const ORDER_ADDED = 'ORDER_ADDED';
export const ORDER_REMOVED = 'ORDER_REMOVED'; // Not part of 0x protocol

export interface OrderEvent<T extends OrderAdded | OrderUpdated > {
    type: string;
    payload: T;
}

export interface OrderAdded {
    order: SignedOrder;
    makerTokenAddress: string;
    takerTokenAddress: string;
}

export interface OrderUpdated {
    order: SignedOrder;
    orderState: OrderRelevantState;
    makerTokenAddress: string;
    takerTokenAddress: string;
}

export interface OrderRemoved {
    order: SignedOrder;
    exchangeContractErrs: string;
    makerTokenAddress: string;
    takerTokenAddress: string;
}
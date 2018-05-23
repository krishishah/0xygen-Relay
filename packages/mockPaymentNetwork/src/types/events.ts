import { BigNumber } from 'bignumber.js';
import { Token, OrderState, ExchangeContractErrs } from '0x.js';
import { OffChainSignedOrder, OffChainOrderRelevantState } from './schemas';

// Event types
export const ORDER_UPDATED = 'ORDER_FILLED';
export const ORDER_REMOVED = 'ORDER_CANCELLED'; 

export interface OrderEvent<T extends OrderFilled | OrderCancelled > {
    type: string;
    payload: T;
}

export interface OrderFilled {
    order: OffChainSignedOrder;
    orderState: OffChainOrderRelevantState;
}

export interface OrderCancelled {
    order: OffChainSignedOrder;
    orderState: OffChainOrderRelevantState;
}

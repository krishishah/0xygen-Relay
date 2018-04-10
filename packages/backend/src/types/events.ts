import { BigNumber } from 'bignumber.js';
import { SignedOrder, Token } from '0x.js';

// Event types
export const ORDER_UPDATED = 'ORDER_UPDATED';
export const ORDER_ADDED = 'ORDER_ADDED';

export interface OrderEvent<T extends OrderAdded | OrderUpdated > {
    type: string;
    payload: T;
}

export interface OrderAdded {
    order: SignedOrder;
    baseTokenAddress: string;
    quoteTokenAddress: string;
}

export interface OrderUpdated {
    order: SignedOrder;
    orderState: OrderUpdateState;
    baseTokenAddress: string;
    quoteTokenAddress: string;
}

export interface OrderUpdateState {
    remainingFillableMakerTokenAmount: BigNumber;
    remainingFillableTakerTokenAmount: BigNumber;
    makerBalance?: BigNumber;
    makerProxyAllowance?: BigNumber;
    makerFeeBalance?: BigNumber;
    makerFeeProxyAllowance?: BigNumber;
    filledTakerTokenAmount?: BigNumber;
    cancelledTakerTokenAmount?: BigNumber;
}
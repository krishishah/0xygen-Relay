import { BigNumber } from 'bignumber.js';
import { Token, OrderState, ExchangeContractErrs } from '0x.js';
import { OffChainSignedOrder, OffChainOrderRelevantState } from './schemas';

// Event update types
export const ORDER_UPDATED = 'ORDER_UPDATED';

// Event types
export const ORDER_FILL_EVENT = 'fill';
export const ORDER_CANCEL_EVENT = 'cancel';

export interface OrderEvent<T extends OrderUpdate> {
    type: string;
    payload: T;
}

export interface OrderUpdate {
    order: OffChainSignedOrder;
    remainingFillableMakerAmount: BigNumber;
    remainingFillableTakerAmount: BigNumber;
}
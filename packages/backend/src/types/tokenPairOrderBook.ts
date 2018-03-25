import { SignedOrder } from '0x.js';

export interface TokenPairOrderbook {
    bids: SignedOrder[];
    asks: SignedOrder[];
}
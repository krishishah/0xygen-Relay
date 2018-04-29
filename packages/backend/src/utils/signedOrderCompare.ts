import { SignedOrder } from '@0xproject/types';
import { EnrichedSignedOrder } from '../types/schemas';

// This compare function assumes MAKER/TAKER token pair
export function enrichedSignedOrderCompare(x: EnrichedSignedOrder, y: EnrichedSignedOrder): number {
    const xPrice = x.signedOrder.takerTokenAmount.dividedBy(x.signedOrder.makerTokenAmount);
    const yPrice = y.signedOrder.takerTokenAmount.dividedBy(y.signedOrder.makerTokenAmount);
    
    // Sort by descending order of rate
    if (!xPrice.equals(yPrice)) {
        return yPrice.minus(xPrice).toNumber();
    }

    // Followed by ascending order of fees or expiration
    const xFees = x.signedOrder.takerFee.add(x.signedOrder.makerFee);
    const yFees = y.signedOrder.takerFee.add(y.signedOrder.makerFee);

    if (!xFees.equals(yFees)) {
        return xFees.minus(yFees).toNumber();
    }

    return x.signedOrder.expirationUnixTimestampSec.minus(y.signedOrder.expirationUnixTimestampSec).toNumber();
}
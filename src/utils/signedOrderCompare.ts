import { SignedOrder } from '0x.js/lib/src/types';

export function signedOrderCompare(x: SignedOrder, y: SignedOrder): number {
    const xPrice = x.takerTokenAmount.dividedBy(x.makerTokenAmount);
    const yPrice = y.takerTokenAmount.dividedBy(y.makerTokenAmount);

    const xx = x.takerTokenAmount.dividedBy(x.makerTokenAmount).toNumber();
    const yy = y.takerTokenAmount.dividedBy(y.makerTokenAmount).toNumber();
    
    // Sort by descending order of rate
    if (!xPrice.equals(yPrice)) {
        return yPrice.minus(xPrice).toNumber();
    }

    // Followed by ascending order of fees or expiration
    const xFees = x.takerFee.add(x.makerFee);
    const yFees = y.takerFee.add(y.makerFee);

    if (!xFees.equals(yFees)) {
        return xFees.minus(yFees).toNumber();
    }

    return x.expirationUnixTimestampSec.minus(y.expirationUnixTimestampSec).toNumber();
}
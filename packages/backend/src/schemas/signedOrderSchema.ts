import { ECSignature } from '0x.js/lib/src/types';

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
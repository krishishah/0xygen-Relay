import { SignedOrder } from '0x.js/lib/src/types';
import { BigNumber } from 'bignumber.js';
import { ECSignature } from '0x.js';
import { SignedOrderSchema } from '../schemas/signedOrderSchema';

export class SerializerUtils {

    public static SignedOrdertoJSON(signedOrder: SignedOrder): SignedOrderSchema {
        return {
            ecSignature: signedOrder.ecSignature,
            maker: signedOrder.maker,
            taker: signedOrder.taker,
            makerFee: signedOrder.makerFee.toString(),
            takerFee: signedOrder.takerFee.toString(),
            makerTokenAmount: signedOrder.makerTokenAmount.toString(),
            takerTokenAmount: signedOrder.takerTokenAmount.toString(),
            makerTokenAddress: signedOrder.makerTokenAddress,
            takerTokenAddress: signedOrder.takerTokenAddress,
            salt: signedOrder.salt.toString(),
            exchangeContractAddress: signedOrder.exchangeContractAddress,
            feeRecipient: signedOrder.feeRecipient,
            expirationUnixTimestampSec: signedOrder.expirationUnixTimestampSec.toString()
        };
    }

    public static SignedOrderfromJSON(signedOrderObj: SignedOrderSchema): SignedOrder {
        try {
            const signedOrder: SignedOrder = {
                ecSignature: signedOrderObj.ecSignature,
                maker: signedOrderObj.maker,
                taker: signedOrderObj.taker,
                makerFee: new BigNumber(signedOrderObj.makerFee),
                takerFee: new BigNumber(signedOrderObj.takerFee),
                makerTokenAmount: new BigNumber(signedOrderObj.makerTokenAmount),
                takerTokenAmount: new BigNumber(signedOrderObj.takerTokenAmount),
                makerTokenAddress: signedOrderObj.makerTokenAddress,
                takerTokenAddress: signedOrderObj.takerTokenAddress,
                salt: new BigNumber(signedOrderObj.salt),
                exchangeContractAddress: signedOrderObj.exchangeContractAddress,
                feeRecipient: signedOrderObj.feeRecipient,
                expirationUnixTimestampSec: new BigNumber(signedOrderObj.expirationUnixTimestampSec)
            };
            return signedOrder;
        } catch (e) {
            console.log(e);
        }
    }

}
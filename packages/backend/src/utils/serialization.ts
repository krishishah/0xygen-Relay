import { SignedOrder } from '@0xproject/types';
import { BigNumber } from 'bignumber.js';
import { ECSignature } from '0x.js';
import { 
    SignedOrderSchema, 
    TokenPairOrderbookSchema, 
    EnrichedSignedOrder, 
    OffChainSignedOrder, 
    OffChainSignedOrderSchema, 
    OffChainSignedOrderStatusSchema, 
    OffChainSignedOrderStatus,
    TokenPairOrderbook,
    OffChainTokenPairOrderbook,
    OffChainTokenPairOrderbookSchema
} from '../types/schemas';

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

    public static TokenPairOrderbooktoJSON(
        tokenPairOrderbook: TokenPairOrderbook
    ): TokenPairOrderbookSchema {
        const tokenPairOrderbookSchema: TokenPairOrderbookSchema  = {
            bids: tokenPairOrderbook.bids.map(bid => SerializerUtils.SignedOrdertoJSON(bid)),
            asks: tokenPairOrderbook.asks.map(ask => SerializerUtils.SignedOrdertoJSON(ask))
        };
        return tokenPairOrderbookSchema;
    }

    public static OffChainTokenPairOrderbooktoJSON(
        tokenPairOrderbook: OffChainTokenPairOrderbook
    ): OffChainTokenPairOrderbookSchema {
        const tokenPairOrderbookSchema: OffChainTokenPairOrderbookSchema  = {
            bids: tokenPairOrderbook.bids.map(bid => SerializerUtils.OffChainSignedOrdertoJSON(bid)),
            asks: tokenPairOrderbook.asks.map(ask => SerializerUtils.OffChainSignedOrdertoJSON(ask))
        };
        return tokenPairOrderbookSchema;
    }

    public static OffChainSignedOrdertoJSON(signedOrder: OffChainSignedOrder): OffChainSignedOrderSchema {
        return {
            ecSignature: signedOrder.ecSignature,
            maker: signedOrder.maker,
            taker: signedOrder.taker,
            makerTokenAmount: signedOrder.makerTokenAmount.toFixed(),
            takerTokenAmount: signedOrder.takerTokenAmount.toFixed(),
            makerTokenAddress: signedOrder.makerTokenAddress,
            takerTokenAddress: signedOrder.takerTokenAddress,
            salt: signedOrder.salt.toFixed(),
            expirationUnixTimestampSec: signedOrder.expirationUnixTimestampSec.toFixed()
        };
    } 

    public static OffChainSignedOrderfromJSON(signedOrderObj: OffChainSignedOrderSchema): OffChainSignedOrder {
        try {
            const signedOrder: OffChainSignedOrder = {
                ecSignature: signedOrderObj.ecSignature,
                maker: signedOrderObj.maker,
                taker: signedOrderObj.taker,
                makerTokenAmount: new BigNumber(signedOrderObj.makerTokenAmount),
                takerTokenAmount: new BigNumber(signedOrderObj.takerTokenAmount),
                makerTokenAddress: signedOrderObj.makerTokenAddress,
                takerTokenAddress: signedOrderObj.takerTokenAddress,
                salt: new BigNumber(signedOrderObj.salt),
                expirationUnixTimestampSec: new BigNumber(signedOrderObj.expirationUnixTimestampSec)
            };
            return signedOrder;
        } catch (e) {
            console.log(e);
        }
    }

    public static OrderStatusFromJSON(schema: OffChainSignedOrderStatusSchema): OffChainSignedOrderStatus {
        const status: OffChainSignedOrderStatus = {
            orderHash: schema.orderHash,
            isValid: schema.isValid,
            signedOrder: SerializerUtils.OffChainSignedOrderfromJSON(schema.signedOrder),
            remainingFillableMakerTokenAmount: new BigNumber(schema.remainingFillableMakerTokenAmount),
            remainingFillableTakerTokenAmount: new BigNumber(schema.remainingFillableTakerTokenAmount)
        };
        return status;
    }
  
}
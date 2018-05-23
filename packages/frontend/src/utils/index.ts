import { BigNumber } from 'bignumber.js';
import { ECSignature, SignedOrder } from '0x.js';
import { 
    SignedOrderSchema, 
    TokenPairOrderbookSchema, 
    TokenPairOrderbook, 
    OrderRelevantStateSchema, 
    OffChainTokenBalancesSchema, 
    OffChainTokenBalances, 
    TokenBalances, 
    OffChainTokenSchema 
} from '../types';
import { OrderRelevantState } from '0x.js/lib/src/types';

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
    }

    public static TokenPairOrderbookFromJSON(tokenPairOrderbookSchema: TokenPairOrderbookSchema): TokenPairOrderbook {
        return {
            bids: tokenPairOrderbookSchema.bids.map(bid => SerializerUtils.SignedOrderfromJSON(bid)),
            asks: tokenPairOrderbookSchema.asks.map(ask => SerializerUtils.SignedOrderfromJSON(ask))
        };
    }

    public static OrderRelevantStateFromJSON(relevantStateSchema: OrderRelevantStateSchema): OrderRelevantState {
        return {
            makerBalance: new BigNumber(relevantStateSchema.makerBalance),
            makerProxyAllowance: new BigNumber(relevantStateSchema.makerProxyAllowance),
            makerFeeBalance: new BigNumber(relevantStateSchema.makerFeeBalance),
            makerFeeProxyAllowance: new BigNumber(relevantStateSchema.makerFeeProxyAllowance),
            filledTakerTokenAmount: new BigNumber(relevantStateSchema.filledTakerTokenAmount),
            cancelledTakerTokenAmount: new BigNumber(relevantStateSchema.cancelledTakerTokenAmount),
            remainingFillableMakerTokenAmount: new BigNumber(relevantStateSchema.remainingFillableMakerTokenAmount),
            remainingFillableTakerTokenAmount: new BigNumber(relevantStateSchema.remainingFillableTakerTokenAmount)
        };
    }

    public static OffChainTokenBalancesFromJSON(schema: OffChainTokenBalancesSchema): OffChainTokenBalances {
        let balances: TokenBalances = new Map();

        schema.tokenBalances.map((tokenSchema: OffChainTokenSchema) => {
            balances.set(tokenSchema.address, new BigNumber(tokenSchema.balance));
        });

        return {
            userAddress: schema.userAddress,
            tokenBalances: balances
        };
    }
}
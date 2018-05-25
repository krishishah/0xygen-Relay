import { BigNumber } from 'bignumber.js';
import { ECSignature } from '0x.js';
import { 
    OffChainSignedOrderSchema, 
    TokenPairOrderbookSchema, 
    EnrichedSignedOrder,
    OffChainSignedOrder,
    TokenBalances,
    TokenSchema,
    TokenBalancesSchema,
    FillOrderRequestSchema,
    OffChainSignedOrderStatus,
    OffChainSignedOrderStatusSchema,
    FillOrderRequest
} from '../types/schemas';
import { TokenPairOrderbook } from '../types/tokenPairOrderBook';

export class SerializerUtils {

    public static SignedOrdertoJSON(signedOrder: OffChainSignedOrder): OffChainSignedOrderSchema {
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

    public static SignedOrderfromJSON(signedOrderObj: OffChainSignedOrderSchema): OffChainSignedOrder {
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

    public static TokenPairOrderbooktoJSON(tokenPairOrderbook: TokenPairOrderbook): TokenPairOrderbookSchema {
        const tokenPairOrderbookSchema: TokenPairOrderbookSchema  = {
            bids: tokenPairOrderbook.bids.map(bid => SerializerUtils.SignedOrdertoJSON(bid)),
            asks: tokenPairOrderbook.asks.map(ask => SerializerUtils.SignedOrdertoJSON(ask))
        };
        return tokenPairOrderbookSchema;
    }

    public static StringTokenBalancesToBigNumber(balances: TokenSchema[]): TokenBalances {
        let res: TokenBalances = new Map();

        try {
            balances.map((value: TokenSchema) => {
                res.set(value.address, new BigNumber(value.balance));
            }); 
        } catch (e) {
            throw e;
        }

        return res;
    }

    public static TokenBalancesToJson(address: string, balances: TokenBalances): TokenBalancesSchema {
        let tokenBalances: TokenSchema[] = [];

        balances.forEach((balance: BigNumber, tokenAddr: string) => {
            tokenBalances.push({
                address: tokenAddr,
                balance: balance.toFixed()
            });
        }); 

        const res: TokenBalancesSchema = {
            userAddress: address,
            tokenBalances: tokenBalances
        };
        
        return res;
    }

    public static FillOrderRequestFromJSON(schema: FillOrderRequestSchema): FillOrderRequest {
        const fillOrderRequest: FillOrderRequest = {
            signedOrder: SerializerUtils.SignedOrderfromJSON(schema.signedOrder),
            takerAddress: schema.takerAddress,
            takerFillAmount: new BigNumber(schema.takerFillAmount),
            ecSignature: schema.ecSignature
        };

        return fillOrderRequest;
    }

    public static OrderStatusToJSON(status: OffChainSignedOrderStatus): OffChainSignedOrderStatusSchema {
        const schema: OffChainSignedOrderStatusSchema = {
            orderHash: status.orderHash,
            isValid: status.isValid,
            signedOrder: SerializerUtils.SignedOrdertoJSON(status.signedOrder),
            remainingFillableMakerTokenAmount: status.remainingFillableMakerTokenAmount.toFixed(),
            remainingFillableTakerTokenAmount: status.remainingFillableTakerTokenAmount.toFixed()
        };
        return schema;
    }

}
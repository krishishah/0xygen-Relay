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
    OffChainTokenSchema, 
    OffChainSignedOrderStatusSchema,
    OffChainSignedOrderStatus,
    OffChainSignedOrderSchema,
    OffChainSignedOrder,
    OffChainTokenPairOrderbookSchema,
    OffChainTokenPairOrderbook,
    OffChainOrder,
    OffChainFillOrder,
    OffChainBatchFillOrder,
    OffChainFillOrderRequest,
    OffChainFillOrderRequestSchema,
    OffChainBatchFillOrderSchema,
    OffChainBatchFillOrderRequest,
    OffChainBatchFillOrderRequestSchema,
    OrderFilledQuantities,
    OrderFilledQuantitiesSchema
} from '../types';
import { OrderRelevantState } from '0x.js/lib/src/types';
import * as ethABI from 'ethereumjs-abi';
import * as ethUtil from 'ethereumjs-util';
import { SolidityTypes } from '@0xproject/types';
import * as _ from 'lodash';

const BN = require('bn.js');

export class Utils {

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
            bids: tokenPairOrderbookSchema.bids.map(bid => Utils.SignedOrderfromJSON(bid)),
            asks: tokenPairOrderbookSchema.asks.map(ask => Utils.SignedOrderfromJSON(ask))
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

    public static OffChainTokenPairOrderbookFromJSON(
        schema: OffChainTokenPairOrderbookSchema
    ): OffChainTokenPairOrderbook {
        const res: OffChainTokenPairOrderbook  = {
            bids: schema.bids.map(bid => Utils.OffChainSignedOrderfromJSON(bid)),
            asks: schema.asks.map(ask => Utils.OffChainSignedOrderfromJSON(ask))
        };
        return res;
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
    }

    public static OrderStatusFromJSON(schema: OffChainSignedOrderStatusSchema): OffChainSignedOrderStatus {
        const status: OffChainSignedOrderStatus = {
            orderHash: schema.orderHash,
            isValid: schema.isValid,
            signedOrder: Utils.OffChainSignedOrderfromJSON(schema.signedOrder),
            remainingFillableMakerTokenAmount: new BigNumber(schema.remainingFillableMakerTokenAmount),
            remainingFillableTakerTokenAmount: new BigNumber(schema.remainingFillableTakerTokenAmount)
        };
        return status;
    }

    public static OffChainFillOrderRequestToJSON(fillOrder: OffChainFillOrderRequest): OffChainFillOrderRequestSchema {
        const request: OffChainFillOrderRequestSchema = {
            signedOrder: Utils.OffChainSignedOrdertoJSON(fillOrder.signedOrder),
            takerAddress: fillOrder.takerAddress,
            takerFillAmount: fillOrder.takerFillAmount.toFixed(),
            ecSignature: fillOrder.ecSignature
        }; 

        return request;
    }

    public static OffChainBatchFillOrderRequestToJSON(
        batchFillOrder: OffChainBatchFillOrderRequest
    ): OffChainBatchFillOrderRequestSchema {
        const orderSchemas = batchFillOrder.signedOrders.map((order: OffChainSignedOrder) => {
            return Utils.OffChainSignedOrdertoJSON(order);
        });

        const schema: OffChainBatchFillOrderRequestSchema = {
            signedOrders: orderSchemas,
            takerAddress: batchFillOrder.takerAddress,
            takerFillAmount: batchFillOrder.takerFillAmount.toFixed(),
            ecSignature: batchFillOrder.ecSignature
        }; 

        return schema;
    }

    public static OrderFilledQuantitiesFromJSON(schema: OrderFilledQuantitiesSchema): OrderFilledQuantities {
        const res: OrderFilledQuantities = {
            filledMakerAmount: new BigNumber(schema.filledMakerAmount),
            filledTakerAmount: new BigNumber(schema.filledTakerAmount)
        };
        return res;
    }
    
    public static BigNumberToBN(value: BigNumber) {
        const base = 10;
        return new BN(value.toFixed(), base);
    }
    
    public static GetOffChainOrderHashHex(order: OffChainOrder | OffChainSignedOrder): string {
        const orderParts = [
            { value: order.maker, type: SolidityTypes.Address },
            { value: order.taker, type: SolidityTypes.Address },
            { value: order.makerTokenAddress, type: SolidityTypes.Address },
            { value: order.takerTokenAddress, type: SolidityTypes.Address },
            {
                value: this.BigNumberToBN(order.makerTokenAmount),
                type: SolidityTypes.Uint256,
            },
            {
                value: this.BigNumberToBN(order.takerTokenAmount),
                type: SolidityTypes.Uint256,
            },
            {
                value: this.BigNumberToBN(order.expirationUnixTimestampSec),
                type: SolidityTypes.Uint256,
            },
            { value: this.BigNumberToBN(order.salt), type: SolidityTypes.Uint256 }
        ];
        const types = _.map(orderParts, o => o.type);
        const values = _.map(orderParts, o => o.value);
        const hashBuff = ethABI.soliditySHA3(types, values);
        const hashHex = ethUtil.bufferToHex(hashBuff);
        return hashHex;
    }
    
    public static GetOffChainSignedOrderHashHex(order: OffChainSignedOrder): string {
        const orderParts = [
            { value: order.maker, type: SolidityTypes.Address },
            { value: order.taker, type: SolidityTypes.Address },
            { value: order.makerTokenAddress, type: SolidityTypes.Address },
            { value: order.takerTokenAddress, type: SolidityTypes.Address },
            {
                value: this.BigNumberToBN(order.makerTokenAmount),
                type: SolidityTypes.Uint256,
            },
            {
                value: this.BigNumberToBN(order.takerTokenAmount),
                type: SolidityTypes.Uint256,
            },
            {
                value: this.BigNumberToBN(order.expirationUnixTimestampSec),
                type: SolidityTypes.Uint256,
            },
            { 
                value: this.BigNumberToBN(order.salt), 
                type: SolidityTypes.Uint256 
            },
            { 
                value: order.ecSignature.v, 
                type: SolidityTypes.Uint8 
            },
            { 
                value: order.ecSignature.r, 
                type: 'bytes32'
            },
            { 
                value: order.ecSignature.s, 
                type: 'bytes32'
            }
        ];
        const types = _.map(orderParts, o => o.type);
        const values = _.map(orderParts, o => o.value);
        const hashBuff = ethABI.soliditySHA3(types, values);
        const hashHex = ethUtil.bufferToHex(hashBuff);
        return hashHex;
    }  
    
    public static GetOffChainBatchFillOrderHashHex(batchFillOrderReq: OffChainBatchFillOrder): string {
        // tslint:disable-next-line:no-any
        let orderParts: Array<{value: any, type: string}> = [];

        batchFillOrderReq.signedOrders.map((order: OffChainSignedOrder) => {
            const parts = [
                { value: order.maker, type: SolidityTypes.Address },
                { value: order.taker, type: SolidityTypes.Address },
                { value: order.makerTokenAddress, type: SolidityTypes.Address },
                { value: order.takerTokenAddress, type: SolidityTypes.Address },
                {
                    value: this.BigNumberToBN(order.makerTokenAmount),
                    type: SolidityTypes.Uint256,
                },
                {
                    value: this.BigNumberToBN(order.takerTokenAmount),
                    type: SolidityTypes.Uint256,
                },
                {
                    value: this.BigNumberToBN(order.expirationUnixTimestampSec),
                    type: SolidityTypes.Uint256,
                },
                { 
                    value: this.BigNumberToBN(order.salt), 
                    type: SolidityTypes.Uint256 
                },
                { 
                    value: order.ecSignature.v, 
                    type: SolidityTypes.Uint8 
                },
                { 
                    value: order.ecSignature.r, 
                    type: 'bytes32'
                },
                { 
                    value: order.ecSignature.s, 
                    type: 'bytes32'
                }
            ];
            orderParts.concat(parts);
        });

        orderParts.push({
            value: batchFillOrderReq.takerAddress,
            type: SolidityTypes.Address
        });

        orderParts.push({
            value: this.BigNumberToBN(batchFillOrderReq.takerFillAmount),
            type: SolidityTypes.Uint256
        });

        const types = _.map(orderParts, o => o.type);
        const values = _.map(orderParts, o => o.value);
        console.log('types:' + types.toString(), ' values: ', values.toString());
        const hashBuff = ethABI.soliditySHA3(types, values);
        const hashHex = ethUtil.bufferToHex(hashBuff);
        return hashHex;
    }
}
import { OffChainOrder, OffChainSignedOrder, OffChainBatchFillOrder, OffChainFillOrderRequest } from '../types/schemas';
import * as ethABI from 'ethereumjs-abi';
import * as ethUtil from 'ethereumjs-util';
import { SolidityTypes } from '@0xproject/types';
import BigNumber from 'bignumber.js';
import BN = require('bn.js');
import * as _ from 'lodash';

/**
 * The following orderHashHex implementation has been adopted from 0x.js.
 * All credit goes to them.
 * https://github.com/0xProject/0x-monorepo/ 
 */

function bigNumberToBN(value: BigNumber): BN {
    const base = 10;
    return new BN(value.toFixed(), base);
}

export function getOffChainOrderHashHex(order: OffChainOrder | OffChainSignedOrder): string {
    const orderParts = [
        { value: order.maker, type: SolidityTypes.Address },
        { value: order.taker, type: SolidityTypes.Address },
        { value: order.makerTokenAddress, type: SolidityTypes.Address },
        { value: order.takerTokenAddress, type: SolidityTypes.Address },
        {
            value: bigNumberToBN(order.makerTokenAmount),
            type: SolidityTypes.Uint256,
        },
        {
            value: bigNumberToBN(order.takerTokenAmount),
            type: SolidityTypes.Uint256,
        },
        {
            value: bigNumberToBN(order.expirationUnixTimestampSec),
            type: SolidityTypes.Uint256,
        },
        { value: bigNumberToBN(order.salt), type: SolidityTypes.Uint256 }
    ];
    const types = _.map(orderParts, o => o.type);
    const values = _.map(orderParts, o => o.value);
    const hashBuff = ethABI.soliditySHA3(types, values);
    const hashHex = ethUtil.bufferToHex(hashBuff);
    return hashHex;
}

export function getOffChainSignedOrderHashHex(order: OffChainSignedOrder): string {
    const orderParts = [
        { value: order.maker, type: SolidityTypes.Address },
        { value: order.taker, type: SolidityTypes.Address },
        { value: order.makerTokenAddress, type: SolidityTypes.Address },
        { value: order.takerTokenAddress, type: SolidityTypes.Address },
        {
            value: bigNumberToBN(order.makerTokenAmount),
            type: SolidityTypes.Uint256,
        },
        {
            value: bigNumberToBN(order.takerTokenAmount),
            type: SolidityTypes.Uint256,
        },
        {
            value: bigNumberToBN(order.expirationUnixTimestampSec),
            type: SolidityTypes.Uint256,
        },
        { 
            value: bigNumberToBN(order.salt), 
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

export function getOffChainFillOrderReqHashHex(batchFillOrderReq: OffChainFillOrderRequest): string {
    const order: OffChainSignedOrder = batchFillOrderReq.signedOrder;

    const parts = [
        { value: order.maker, type: SolidityTypes.Address },
        { value: order.taker, type: SolidityTypes.Address },
        { value: order.makerTokenAddress, type: SolidityTypes.Address },
        { value: order.takerTokenAddress, type: SolidityTypes.Address },
        {
            value: bigNumberToBN(order.makerTokenAmount),
            type: SolidityTypes.Uint256,
        },
        {
            value: bigNumberToBN(order.takerTokenAmount),
            type: SolidityTypes.Uint256,
        },
        {
            value: bigNumberToBN(order.expirationUnixTimestampSec),
            type: SolidityTypes.Uint256,
        },
        { 
            value: bigNumberToBN(order.salt), 
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
        },
        {
            value: batchFillOrderReq.takerAddress,
            type: SolidityTypes.Address
        },
        {
            value: bigNumberToBN(batchFillOrderReq.takerFillAmount),
            type: SolidityTypes.Uint256
        },
    ];
    const types = _.map(parts, o => o.type);
    const values = _.map(parts, o => o.value);
    const hashBuff = ethABI.soliditySHA3(types, values);
    const hashHex = ethUtil.bufferToHex(hashBuff);
    return hashHex;

}

export function getOffChainBatchFillOrderHashHex(batchFillOrderReq: OffChainBatchFillOrder): string {
    try {
        // tslint:disable-next-line:no-any
        let orderParts: Array<{value: any, type: string}> = [];

        batchFillOrderReq.signedOrders.map((order: OffChainSignedOrder) => {
            const parts = [
                { value: order.maker, type: SolidityTypes.Address },
                { value: order.taker, type: SolidityTypes.Address },
                { value: order.makerTokenAddress, type: SolidityTypes.Address },
                { value: order.takerTokenAddress, type: SolidityTypes.Address },
                {
                    value: bigNumberToBN(order.makerTokenAmount),
                    type: SolidityTypes.Uint256,
                },
                {
                    value: bigNumberToBN(order.takerTokenAmount),
                    type: SolidityTypes.Uint256,
                },
                {
                    value: bigNumberToBN(order.expirationUnixTimestampSec),
                    type: SolidityTypes.Uint256,
                },
                { 
                    value: bigNumberToBN(order.salt), 
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
            value: bigNumberToBN(batchFillOrderReq.takerFillAmount),
            type: SolidityTypes.Uint256
        });

        const types = _.map(orderParts, o => o.type);
        const values = _.map(orderParts, o => o.value);
        const hashBuff = ethABI.soliditySHA3(types, values);
        const hashHex = ethUtil.bufferToHex(hashBuff);
        return hashHex;
    } catch (e) {
        console.log('Cant hash batch fill order: ', e);
    }

}

export function addSignedMessagePrefix(message: string): string {
    try {
        const msgBuff = ethUtil.toBuffer(message);
        const prefixedMsgBuff = ethUtil.hashPersonalMessage(msgBuff);
        const prefixedMsgHex = ethUtil.bufferToHex(prefixedMsgBuff);
        return prefixedMsgHex;
    } catch (e) {
        console.log('Could not add signed message prefix: ', e);
    }

}
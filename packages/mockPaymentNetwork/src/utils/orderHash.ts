import { OffChainOrder, OffChainSignedOrder } from '../types/schemas';
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
    return new BN(value.toString(), base);
}

export function getOrderHashHex(order: OffChainOrder | OffChainSignedOrder): string {
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
        { value: bigNumberToBN(order.salt), type: SolidityTypes.Uint256 },
    ];
    const types = _.map(orderParts, o => o.type);
    const values = _.map(orderParts, o => o.value);
    const hashBuff = ethABI.soliditySHA3(types, values);
    const hashHex = ethUtil.bufferToHex(hashBuff);
    return hashHex;
}
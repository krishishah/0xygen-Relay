import { ZeroEx, ZeroExConfig } from '0x.js';
import { isNullOrUndefined } from 'util';
import * as Web3 from 'web3';
import { Provider } from '@0xproject/types';
import { KOVAN_NETWORK_ID, KOVAN_RPC } from '../index';
import { Service } from 'typedi';

@Service()
export class ZeroExWrapper {

    static zeroEx: ZeroEx;

    constructor() {
        const zeroExConfig: ZeroExConfig = {
            networkId: KOVAN_NETWORK_ID,
        };
        
        const provider = new Web3.providers.HttpProvider(KOVAN_RPC);

        if (isNullOrUndefined(ZeroExWrapper.zeroEx)) {
            ZeroExWrapper.zeroEx = new ZeroEx(provider, zeroExConfig);

        }
    }

}
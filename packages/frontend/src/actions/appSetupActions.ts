import { Web3Provider, ZeroExConfig, ZeroEx } from '0x.js';
const Web3ProviderEngine = require('web3-provider-engine');
import * as Web3 from 'web3';

export const INSTANTIATE_0X = 'INSTANTIATE_0X';
export const INSTANTIATE_WEB3 = 'INSTANTIATE_WEB3';

export function instatiateZeroEx(provider: Web3Provider, config: ZeroExConfig) {
  return {
    type: INSTANTIATE_0X,
    zeroEx: new ZeroEx(provider, config)
  };
}

// tslint:disable-next-line:typedef
export function instatiateWeb3(providerEngine) {
    return {
      type: INSTANTIATE_WEB3,
      zeroEx: new Web3(providerEngine)
    };
  }
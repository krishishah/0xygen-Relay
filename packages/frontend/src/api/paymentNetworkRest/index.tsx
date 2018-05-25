import * as React from 'react';
import { SignedOrder } from '0x.js';
import axios, { AxiosRequestConfig, AxiosPromise, AxiosResponse, AxiosError } from 'axios';
import { SerializerUtils } from '../../utils';
import { SignedOrderSchema, OffChainTokenBalancesSchema, OffChainTokenBalances } from '../../types';

const PAYMENT_NETWORK_HOST: string = 'http://localhost:3003';
const PAYMENT_NETWORK_GET_BALANCES_URI = (address: string) => `/balances/${address}`;

export class PaymentNetworkRestfulClient extends React.Component {

    getBalances = (address: string): Promise<OffChainTokenBalances> => {
        return axios.get(`${PAYMENT_NETWORK_HOST}${PAYMENT_NETWORK_GET_BALANCES_URI(address)}`)
            .then((response: AxiosResponse<OffChainTokenBalancesSchema>) => {
                return SerializerUtils.OffChainTokenBalancesFromJSON(response.data);
            })
            .catch((error: AxiosError) => {
                console.log(error.message);
                return {
                    userAddress: address,
                    tokenBalances: new Map()
                };
            }
        );
    }

    render() {
        return null;
    }
}
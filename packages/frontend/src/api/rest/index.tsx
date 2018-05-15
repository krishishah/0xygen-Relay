import * as React from 'react';
import { SignedOrder } from '0x.js';
import axios, { AxiosRequestConfig, AxiosPromise, AxiosResponse, AxiosError } from 'axios';
import { SerializerUtils } from '../../utils';
import { SignedOrderSchema } from '../../types';

interface Props { }

interface State { }

const RELAYER_HOST: string = 'http://localhost:3000';
const RELAYER_POST_ORDER_URI: string = '/v0/order';

const LIQUIDITY_NETWORK_HOST: string = 'https://wallet.liquidity.network/';
const LIQUIDITY_CREATE_PAYMENT = '/payment';
const LIQUIDITY_AUTHORISE_PAYMENT_URI = (uuid: string) => `/payment/authorize/${uuid}`;
const LIQUIDITY_EXECUTE_AUTORISED_PAYMENT_URI = (uuid: string) => `/payment/execute/${uuid}`;

// Get balance URI
// Authentication process

// What is liquidity's definition of a wallet

export class RelayerRestfulClient extends React.Component {

    postSignedOrder = (signedOrder: SignedOrder): Promise<boolean> => {
        const orderJSON: SignedOrderSchema = SerializerUtils.SignedOrdertoJSON(signedOrder);
        return axios.post(`${RELAYER_HOST}${RELAYER_POST_ORDER_URI}`, orderJSON)
            .then((response: AxiosResponse) => {
                return true;
            })
            .catch((error: AxiosError) => {
                console.log(error.message);
                return false;
            }
        );
    }

    render() {
        return null;
    }
}

export class LiquidityNetworkRestfulClient extends React.Component {
    
    render() {
        return null;
    }
}
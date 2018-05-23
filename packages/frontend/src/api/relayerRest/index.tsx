import * as React from 'react';
import { SignedOrder } from '0x.js';
import axios, { AxiosRequestConfig, AxiosPromise, AxiosResponse, AxiosError } from 'axios';
import { SerializerUtils } from '../../utils';
import { SignedOrderSchema } from '../../types';

const RELAYER_HOST: string = 'http://localhost:3000';
const RELAYER_POST_ORDER_URI: string = '/v0/order';

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
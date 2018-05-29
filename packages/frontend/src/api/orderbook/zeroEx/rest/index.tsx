import * as React from 'react';
import { SignedOrder } from '0x.js';
import axios, { AxiosRequestConfig, AxiosPromise, AxiosResponse, AxiosError } from 'axios';
import { Utils } from '../../../../utils';
import { SignedOrderSchema } from '../../../../types';
import { RELAYER_HOST } from '../../../../config';

const RELAYER_POST_ORDER_URI: string = '/v0/order';

export class ZeroExRelayerRestfulClient extends React.Component {

    postSignedOrder = (signedOrder: SignedOrder): Promise<boolean> => {
        const orderJSON: SignedOrderSchema = Utils.SignedOrdertoJSON(signedOrder);
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
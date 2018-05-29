import * as React from 'react';
import { SignedOrder } from '0x.js';
import axios, { AxiosRequestConfig, AxiosPromise, AxiosResponse, AxiosError } from 'axios';
import { Utils } from '../../../../utils';
import { SignedOrderSchema, OffChainSignedOrder, OffChainSignedOrderSchema } from '../../../../types';
import { RELAYER_HOST } from '../../../../config';

const RELAYER_POST_ORDER_URI: string = '/off_chain/order';

export class OffChainRelayerRestfulClient extends React.Component {

    postSignedOrder = (signedOrder: OffChainSignedOrder): Promise<boolean> => {
        const orderJSON: OffChainSignedOrderSchema = Utils.OffChainSignedOrdertoJSON(signedOrder);
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
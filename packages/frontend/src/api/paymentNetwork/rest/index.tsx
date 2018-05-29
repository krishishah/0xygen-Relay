import * as React from 'react';
import { SignedOrder } from '0x.js';
import axios, { AxiosRequestConfig, AxiosPromise, AxiosResponse, AxiosError } from 'axios';
import { Utils } from '../../../utils';
import { 
    SignedOrderSchema, 
    OffChainTokenBalancesSchema, 
    OffChainTokenBalances, 
    OffChainSignedOrderStatus, 
    OffChainSignedOrderStatusSchema, 
    OffChainSignedOrder,
    OffChainBatchFillOrderRequest,
    OrderFilledQuantitiesSchema,
    OrderFilledQuantities
} from '../../../types';
import { PAYMENT_NETWORK_HTTP_URL } from '../../../config';

const PAYMENT_NETWORK_GET_BALANCES_URI = (address: string) => `/balances/${address}`;
const PAYMENT_NETWORK_GET_ORDER_STATUS_URI = `/exchange/order/status`;
const PAYMENT_NETWORK_BATCH_FILL_URI = `/exchange/order/batch_fill_up_to`;
       
export class PaymentNetworkRestfulClient extends React.Component {

    getBalances = (address: string): Promise<OffChainTokenBalances> => {
        return axios.get(`${PAYMENT_NETWORK_HTTP_URL}${PAYMENT_NETWORK_GET_BALANCES_URI(address)}`)
            .then((response: AxiosResponse<OffChainTokenBalancesSchema>) => {
                return Utils.OffChainTokenBalancesFromJSON(response.data);
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
    
    getOrderStatus = (order: OffChainSignedOrder): Promise<OffChainSignedOrderStatus> => {
        const orderSchema = Utils.OffChainSignedOrdertoJSON(order);

        return axios.post(`${PAYMENT_NETWORK_HTTP_URL}${PAYMENT_NETWORK_GET_ORDER_STATUS_URI}`, orderSchema)
            .then((response: AxiosResponse<OffChainSignedOrderStatusSchema>) => {
                return Utils.OrderStatusFromJSON(response.data);
            }
        )
        .catch((error: AxiosError) => {
            console.log(error.message);
            throw error;
        });
    }

    batchFillOrders = (request: OffChainBatchFillOrderRequest): Promise<OrderFilledQuantities> => {
        const schema = Utils.OffChainBatchFillOrderRequestToJSON(request);

        return axios.post(`${PAYMENT_NETWORK_HTTP_URL}${PAYMENT_NETWORK_BATCH_FILL_URI}`, schema)
            .then((response: AxiosResponse<OrderFilledQuantitiesSchema>) => {
                return Utils.OrderFilledQuantitiesFromJSON(response.data);
            }
        )
        .catch((error: AxiosError) => {
            console.log(error.message);
            throw error;
        });
    }
    
    render() {
        return null;
    }
}
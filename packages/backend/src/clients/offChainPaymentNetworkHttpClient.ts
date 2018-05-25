import { Service } from 'typedi';
import { PAYMENT_NETWORK_HTTP_HOST } from '..';
import axios, { AxiosRequestConfig, AxiosPromise, AxiosResponse, AxiosError } from 'axios';
import { OffChainSignedOrderStatus, OffChainSignedOrderStatusSchema } from '../types/schemas';
import { SerializerUtils } from '../utils/serialization';

const PAYMENT_NETWORK_GET_ORDER_STATUS_URI = (address: string) => `/balances/${address}`;

@Service()
export class OffChainPaymentNetworkHttpClient {

    getOrderStatus = (orderHashHex: string): Promise<OffChainSignedOrderStatus> => {
        return axios.get(`${PAYMENT_NETWORK_HTTP_HOST}${PAYMENT_NETWORK_GET_ORDER_STATUS_URI(orderHashHex)}`)
            .then((response: AxiosResponse<OffChainSignedOrderStatusSchema>) => {
                return SerializerUtils.OrderStatusFromJSON(response.data);
            }
        )
        .catch((error: AxiosError) => {
            console.log(error.message);
            throw error;
        });
    }

}
import { Service } from 'typedi';
import { PAYMENT_NETWORK_HTTP_HOST } from '..';
import axios, { AxiosRequestConfig, AxiosPromise, AxiosResponse, AxiosError } from 'axios';
import { OffChainSignedOrderStatus, OffChainSignedOrderStatusSchema, OffChainSignedOrder } from '../types/schemas';
import { SerializerUtils } from '../utils/serialization';

const PAYMENT_NETWORK_GET_ORDER_STATUS_URI = `/exchange/order/status`;

@Service()
export class OffChainPaymentNetworkHttpClient {

    getOrderStatus = (order: OffChainSignedOrder): Promise<OffChainSignedOrderStatus> => {
        const orderSchema = SerializerUtils.OffChainSignedOrdertoJSON(order);

        return axios.post(`${PAYMENT_NETWORK_HTTP_HOST}${PAYMENT_NETWORK_GET_ORDER_STATUS_URI}`, orderSchema)
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
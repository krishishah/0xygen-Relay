import { ZeroEx, OrderState, ExchangeContractErrs,  } from '0x.js';
import { OrderStateInvalid, OrderStateValid } from '0x.js/lib/src/types';
import { BigNumber } from '@0xproject/utils/lib/configured_bignumber';
import { SignedOrder, BlockParamLiteral } from '@0xproject/types';
import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';
import { 
    EnrichedSignedOrder, 
    TokenBalances, 
    OffChainSignedOrder, 
    OffChainEnrichedSignedOrder, 
    OffChainSignedOrderStatus, 
    OffChainSignedOrderSchema,
    OffChainTokenPairOrderbook,
    PaymentNetworkWebSocketMessage,
    PaymentNetworkUpdate
} from '../types/schemas';
import { promisify } from 'util';
import { OffChainSignedOrderEntity } from '../entities/offChainSignedOrderEntity';
import { OffChainSignedOrderRepository } from '../repositories/offChainSignedOrderRepository';
import { getOffChainOrderHashHex } from '../utils/offChainOrderHash';
import { 
    ORDER_ADDED, 
    OrderEvent, 
    OrderAdded, 
    OffChainOrderAdded, 
    OFF_CHAIN_ORDER_ADDED 
} from '../types/events';
import { EventPubSub } from './eventPubSub';
import { OffChainPaymentNetworkHttpClient } from '../clients/offChainPaymentNetworkHttpClient';
import { stat } from 'fs';
import { SerializerUtils } from '../utils/serialization';
import { OffChainPaymentNetworkWsClient } from '../clients/offChainPaymentNetworkWsClient';

@Service()
export class OffChainOrderService {
  
    /**
     * Creates an instance of PaymentNetworkService.
     * @param {UserTokenBalanceRepository} userTokenBalanceRepository 
     * @param {OffChainSignedOrderRepository} offChainSignedOrderRepository 
     * @memberof PaymentNetworkService
     */
    constructor(
        @OrmRepository(OffChainSignedOrderEntity)
        private offChainSignedOrderRepository: OffChainSignedOrderRepository,
        private httpClient: OffChainPaymentNetworkHttpClient,
        private pubSubClient: EventPubSub,
    ) { 
        this.onPaymentNetworkUpdate.bind(this);
        this.init();
    }

    /**
     * Get Off-Chain Orderbook for a given token pair. If no orders are found, an empty orderbook
     * is returned
     * @param {string} baseTokenAddress 
     * @param {string} quoteTokenAddress 
     * @returns {Promise<OffChainTokenPairOrderbook>} 
     * @memberof OffChainOrderService
     */
    public getOrderbook(
        baseTokenAddress: string,
        quoteTokenAddress: string
    ): Promise<OffChainTokenPairOrderbook> {
        return Promise.all(
            [
                // Bids have quote as the makerTokenAddress and base as the takerTokenAddress
                this.offChainSignedOrderRepository.getEnrichedTokenPairOrders(
                    quoteTokenAddress, 
                    baseTokenAddress
                ),
                
                // Asks have base as the makerTokenAddress and quots as the takerTokenAddress
                this.offChainSignedOrderRepository.getEnrichedTokenPairOrders(
                    baseTokenAddress, 
                    quoteTokenAddress
                ) 
            ]
        )
        .then(tokenPairs => {
            const orderBook: OffChainTokenPairOrderbook = {
                bids: tokenPairs[0].map(o => o.signedOrder),
                asks: tokenPairs[1].map(o => o.signedOrder)
            };

            return orderBook;
        });
    }
  
    public getOrders() {
        return null;
    }
  
    /**
     * Get off-chain signed order or throw an error if no orders satisfy the 
     * order hash hex.
     * 
     * @param {string} orderHashHex 
     * @returns {Promise<OffChainSignedOrder>} 
     * @memberof OffChainOrderService
     */
    public getOrder(orderHashHex: string): Promise<OffChainSignedOrder> {
        return this.offChainSignedOrderRepository
                   .getOffChainSignedOrder(orderHashHex)
                   .catch(error => { throw error; });
    }

    /**
     * Post an enriched version of order to the repository and publish it 
     * to subscribers given it is valid.
     * @param {OffChainSignedOrder} order 
     * @returns {Promise<void>} 
     * @memberof OffChainOrderService
     */
    async postOrder(order: OffChainSignedOrder): Promise<void> {
        let orderHashHex: string = getOffChainOrderHashHex(order);

        let enrichedOrder: OffChainEnrichedSignedOrder;
        
        this.validateAndEnrichOffChainSignedOrder(order)
            .then((enrichedSignedOrder: OffChainEnrichedSignedOrder) => {
                enrichedOrder = enrichedSignedOrder;
                return this.offChainSignedOrderRepository.addOrUpdateOrder(
                    enrichedSignedOrder, 
                    orderHashHex
                );
            })
            .then((_: EnrichedSignedOrder) => {
                const orderEvent: OrderEvent<OffChainOrderAdded> = {
                    type: OFF_CHAIN_ORDER_ADDED,
                    payload: {
                        order: order,
                        makerTokenAddress: order.makerTokenAddress,
                        takerTokenAddress: order.takerTokenAddress
                    }
                };
                this.pubSubClient.publish(OFF_CHAIN_ORDER_ADDED, orderEvent);
            })
            .catch(error => {
                throw error;
            }
        );
    }

    /**
     * Enrich order if it is valid otherwise throw.
     * @param {OffChainSignedOrder} signedOrder 
     * @returns {Promise<OffChainEnrichedSignedOrder>} 
     * @memberof OffChainOrderService
     */
    validateAndEnrichOffChainSignedOrder(
        signedOrder: OffChainSignedOrder
    ): Promise<OffChainEnrichedSignedOrder> {
        let orderHashHex: string = getOffChainOrderHashHex(signedOrder);
        
        const enrichedOrder: OffChainEnrichedSignedOrder = {
            signedOrder: signedOrder,
            remainingMakerTokenAmount: signedOrder.makerTokenAmount,
            remainingTakerTokenAmount: signedOrder.takerTokenAmount
        };

        let filledOrCancelledTakerAmount = new BigNumber(0);

        return this
            .httpClient
            .getOrderStatus(signedOrder)
            .then((status: OffChainSignedOrderStatus) => {
                if (status.isValid) {
                    enrichedOrder.remainingMakerTokenAmount = status.remainingFillableMakerTokenAmount;
                    enrichedOrder.remainingTakerTokenAmount = status.remainingFillableTakerTokenAmount;
                } else {
                    throw `Invalid order: ${signedOrder}`;
                }
                return enrichedOrder;
            })
            .catch(err => {
                throw err;
            }
        );          
    }

    /**
     * Get off-chain enriched signed order from repository or throw if no entities found.
     * @param {string} orderHashHex 
     * @returns {Promise<EnrichedSignedOrder>} 
     * @memberof PaymentNetworkService
     */
    getEnrichedOffChainSignedOrder(orderHashHex: string): Promise<OffChainEnrichedSignedOrder> {
        return this.offChainSignedOrderRepository
            .getOffChainEnrichedSignedOrder(orderHashHex)
            .catch(e => { throw e; });
    }

    /**
     * Listens for web socket updates from payment network and updates orders if they currently
     * exist in the orderbook otherwise updates are ignored
     * @param {PaymentNetworkUpdate} paymentNetworkUpdate 
     * @memberof OffChainOrderService
     */
    onPaymentNetworkUpdate(paymentNetworkUpdate: PaymentNetworkUpdate) {
        const order = SerializerUtils.OffChainSignedOrderfromJSON(paymentNetworkUpdate.signedOrder);
        const orderHashHex = getOffChainOrderHashHex(order);
        
        if (this.getEnrichedOffChainSignedOrder(orderHashHex)) {
            try {
                this.getEnrichedOffChainSignedOrder(orderHashHex);
            } catch (e) {
                console.log(e);
            }
            const remTakerAmount = new BigNumber(paymentNetworkUpdate.remainingFillableTakerTokenAmount);
            const remMakerAmount = new BigNumber(paymentNetworkUpdate.remainingFillableMakerTokenAmount);
            if (remMakerAmount.lessThanOrEqualTo(0) || remTakerAmount.lessThanOrEqualTo(0)) {
                this.offChainSignedOrderRepository.removeSignedOrderByHashHex(orderHashHex);
            } else {
                const enrichedOrder: OffChainEnrichedSignedOrder = {
                    signedOrder: order, 
                    remainingMakerTokenAmount: remMakerAmount,
                    remainingTakerTokenAmount: remTakerAmount
                };

                this.offChainSignedOrderRepository.addOrUpdateOrder(
                    enrichedOrder,
                    orderHashHex
                );
            }
        }
    }

    private init() {
        this.offChainSignedOrderRepository
            .getAllEnrichedSignedOrders()
            .then((orders: OffChainEnrichedSignedOrder[]) => {
                orders.map((order: OffChainEnrichedSignedOrder) => {
                    this.httpClient
                        .getOrderStatus(order.signedOrder)
                        .then((status: OffChainSignedOrderStatus) => {
                            const hashHex = getOffChainOrderHashHex(order.signedOrder);
                            if (!status.isValid) {
                                this.offChainSignedOrderRepository.removeEnrichedSignedOrder(order, hashHex);
                            } else if (
                                !(order.remainingMakerTokenAmount.eq(status.remainingFillableMakerTokenAmount)
                                && order.remainingTakerTokenAmount.eq(status.remainingFillableTakerTokenAmount))
                            ) {
                                order.remainingMakerTokenAmount = status.remainingFillableMakerTokenAmount;
                                order.remainingTakerTokenAmount = status.remainingFillableTakerTokenAmount;
                                this.offChainSignedOrderRepository.addOrUpdateOrder(order, hashHex);
                            }
                        }).catch(err => {
                            console.log(`Order pruning error: ${err.message}`); 
                        }
                    );
                });
            })
            .catch(err => {
                console.log(`Order pruning error: ${err.message}`); 
            }
        );
    }
}
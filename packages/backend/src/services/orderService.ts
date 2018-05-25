import { ZeroEx, OrderState, ExchangeContractErrs,  } from '0x.js';
import { SignedOrderRepository } from '../repositories/signedOrderRepository';
import { OrderStateInvalid, OrderStateValid } from '0x.js/lib/src/types';
import { BigNumber } from '@0xproject/utils/lib/configured_bignumber';
import { SignedOrder, BlockParamLiteral } from '@0xproject/types';
import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';
import { SchemaValidator } from '@0xproject/json-schemas';
import { SignedOrderEntity } from '../entities/signedOrderEntity';
import { ZeroExWrapper } from '../utils/zeroExWrapper';
import { OrderStateWatcher } from '0x.js/lib/src/order_watcher/order_state_watcher';
import { orderStateWatcherConfig } from '../index';
import { EventPubSub } from './eventPubSub';
import { 
    ORDER_UPDATED, 
    OrderUpdated, 
    OrderEvent, 
    OrderAdded, 
    ORDER_ADDED, 
    OrderRemoved, 
    ORDER_REMOVED 
} from '../types/events';
import { EnrichedSignedOrder, TokenPairOrderbook } from '../types/schemas';
import { promisify } from 'util';

@Service()
export class OrderService {

    orderStateWatcher: OrderStateWatcher;
  
    constructor(
        @OrmRepository(SignedOrderEntity)
        private orderRepository: SignedOrderRepository,
        private pubSubClient: EventPubSub,
        private zeroExClient: ZeroExWrapper
    ) {
        this.init();
    }   

    public getTokenPairs() {
        return null;
    }
  
    public getOrderbook(baseTokenAddress: string, quoteTokenAddress: string): Promise<TokenPairOrderbook> {
        return Promise.all(
            [
                // Bids have quote as the makerTokenAddress and base as the takerTokenAddress
                this.orderRepository.getEnrichedTokenPairOrders(quoteTokenAddress, baseTokenAddress),
                
                // Asks have base as the makerTokenAddress and quots as the takerTokenAddress
                this.orderRepository.getEnrichedTokenPairOrders(baseTokenAddress, quoteTokenAddress) 
            ]
        )
        .then(tokenPairs => {
            const orderBook: TokenPairOrderbook = {
                bids: tokenPairs[0].map(o => o.signedOrder),
                asks: tokenPairs[1].map(o => o.signedOrder)
            };

            return orderBook;
        });
    }
  
    public getOrders() {
        return null;
    }
  
    public getOrder(orderHashHex: string): Promise<SignedOrder> {
        return this.orderRepository
                   .getSignedOrder(orderHashHex)
                   .catch(error => { throw error; });
    }

    public getFees() {
        return null;
    }
  
    public async postOrder(order: SignedOrder): Promise<void> {
        let orderHashHex: string = ZeroEx.getOrderHashHex(order);

        let enrichedOrder: EnrichedSignedOrder;
        
        this.validateAndEnrichSignedOrder(order)
            .then((enrichedSignedOrder: EnrichedSignedOrder) => {
                enrichedOrder = enrichedSignedOrder;
                return this.orderRepository.addOrUpdateOrder(enrichedSignedOrder, orderHashHex);
            })
            .catch(error => {
                throw error;
            })
            .then((_: EnrichedSignedOrder) => {
                const orderEvent: OrderEvent<OrderAdded> = {
                    type: ORDER_ADDED,
                    payload: {
                        order: order,
                        makerTokenAddress: order.makerTokenAddress,
                        takerTokenAddress: order.takerTokenAddress
                    }
                };
                this.pubSubClient.publish(ORDER_ADDED, orderEvent);
                this.watchOrder(order);
            })
            .catch(err => {
                const orderHash = ZeroEx.getOrderHashHex(order);
                this.orderRepository
                    .removeEnrichedSignedOrder(enrichedOrder, orderHash)
                    .then((signedOrder: SignedOrder) => {
                        console.log(`Failed to watch order Error: ${err.message}. Data:\n${JSON.stringify(order)}`);
                    }
                );
                throw err;
            }
        );
    }

    public getTokens() {
        return null;
    }

    public watchOrder(order: SignedOrder) {
        this.orderStateWatcher.addOrder(order);
    }

    public unwatchOrder(order: SignedOrder) {
        const orderHash = ZeroEx.getOrderHashHex(order);
        this.orderStateWatcher.removeOrder(orderHash);
    }

    private async watchOrderbook(): Promise<void> {
        this.orderRepository
            .getAllEnrichedSignedOrders()
            .then((orders: EnrichedSignedOrder[]) => {
                orders.map(order => {
                    try {
                        this.watchOrder(order.signedOrder);
                    } catch ( e ) {
                        this.unwatchOrder(order.signedOrder);
                        const orderHash = ZeroEx.getOrderHashHex(order.signedOrder);
                        this.orderRepository.removeEnrichedSignedOrder(order, orderHash);
                        console.log(`Error: ${e.message}. Failed to watch order:\n${JSON.stringify(order)}`);
                    }
                });
            })
            .catch(e => {
                console.log(`WatchOrderbook Error: ${e.message}`);
            }
        );
    }

    // TODO: Implement special logic for Order fills and cancellations - Currently maker/taker amount is set to 0
    private onOrderWatcherEvent(err: Error | null, orderState?: OrderState) {
        if (orderState && orderState.isValid) {
            const orderRelevantState = orderState.orderRelevantState;

            this.orderRepository
                .getSignedOrder(orderState.orderHash)
                .then(signedOrder => {
                    const enrichedSignedOrder: EnrichedSignedOrder = {
                        signedOrder,
                        remainingMakerTokenAmount: orderRelevantState.remainingFillableMakerTokenAmount,
                        remainingTakerTokenAmount: orderRelevantState.remainingFillableTakerTokenAmount
                    };
                    return enrichedSignedOrder;
                })
                .then((enrichedSignedOrder: EnrichedSignedOrder) => {
                    this.orderRepository.addOrUpdateOrder(enrichedSignedOrder, orderState.orderHash);
                })
                .catch(e => {
                    console.log(`onOrderWatcherEvent Error: ${e.message}`); 
                }
            );
        } else if (orderState && !orderState.isValid) {
            // Invalid OrderState or non existent OrderState with Error
            let state = orderState as OrderStateInvalid;

            this.orderRepository
                .getEnrichedSignedOrder(state.orderHash)
                .then(enrichedSignedOrder => {
                    enrichedSignedOrder.remainingMakerTokenAmount = new BigNumber(0);
                    enrichedSignedOrder.remainingTakerTokenAmount = new BigNumber(0);
                    return enrichedSignedOrder;
                })
                .then(enrichedSignedOrder => {                    
                    this.orderRepository.removeEnrichedSignedOrder(enrichedSignedOrder, state.orderHash);
                    this.unwatchOrder(enrichedSignedOrder.signedOrder);
                })
                .catch(e => { 
                    console.log(`Order Watcher Error: ${err.message}`); 
                }
            );
        } else {
            console.log(`Order Watcher Error: ${err.message}`); 
        }
    }

    private validateAndEnrichSignedOrder(signedOrder: SignedOrder): Promise<EnrichedSignedOrder> {

        let orderHashHex: string = ZeroEx.getOrderHashHex(signedOrder);
        
        const enrichedOrder: EnrichedSignedOrder = {
            signedOrder: signedOrder,
            remainingMakerTokenAmount: signedOrder.makerTokenAmount,
            remainingTakerTokenAmount: signedOrder.takerTokenAmount
        };

        let filledOrCancelledTakerAmount = new BigNumber(0);

        return ZeroExWrapper.zeroEx
            .exchange
            .getCancelledTakerAmountAsync(orderHashHex)
            .then((cancelledTakerAmount: BigNumber) => {
                filledOrCancelledTakerAmount = filledOrCancelledTakerAmount.add(cancelledTakerAmount);
                return ZeroExWrapper.zeroEx.exchange.getFilledTakerAmountAsync(orderHashHex);
            })
            .then((filledTakerAmount: BigNumber) => {
                filledOrCancelledTakerAmount = filledOrCancelledTakerAmount.add(filledTakerAmount);

                const rate = enrichedOrder.signedOrder.makerTokenAmount.div(
                    enrichedOrder.signedOrder.takerTokenAmount
                );
                
                enrichedOrder.remainingTakerTokenAmount = enrichedOrder.remainingTakerTokenAmount.minus(
                    filledOrCancelledTakerAmount
                );

                enrichedOrder.remainingMakerTokenAmount = enrichedOrder.remainingMakerTokenAmount.minus(
                    filledOrCancelledTakerAmount.mul(rate)
                );

                return enrichedOrder;
            })
            .catch(err => {
                throw Error(err.message);
            }
        );          
    }

    private init() {
        this.orderStateWatcher = ZeroExWrapper.zeroEx.createOrderStateWatcher(orderStateWatcherConfig);
        this.watchOrderbook()
            .then((value: void) => {
                this.orderStateWatcher.subscribe(this.onOrderWatcherEvent.bind(this));
            })
            .catch(err => {
                console.log(`RestService Initialisation Error: ${err.message}`); 
            }
        );
    }
}
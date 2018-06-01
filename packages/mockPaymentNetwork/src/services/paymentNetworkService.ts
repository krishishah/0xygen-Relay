import { ZeroEx, OrderState, ExchangeContractErrs,  } from '0x.js';
import { UserTokenBalanceRepository } from '../repositories/userTokenBalanceRepository';
import { OrderStateInvalid, OrderStateValid } from '0x.js/lib/src/types';
import { BigNumber } from '@0xproject/utils/lib/configured_bignumber';
import { SignedOrder, BlockParamLiteral } from '@0xproject/types';
import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';
import { UserTokenBalanceEntity } from '../entities/userTokenBalanceEntity';
import { 
    EnrichedSignedOrder, 
    TokenBalances, 
    OffChainSignedOrder, 
    OffChainFillOrderRequest, 
    OffChainSignedOrderStatus, 
    OffChainBatchFillOrderRequest,
    OrderFilledQuantities,
    OffChainFillOrder
} from '../types/schemas';
import { promisify } from 'util';
import { PaymentChannelSignedOrderEntity } from '../entities/paymentChannelSignedOrderEntity';
import { OffChainSignedOrderRepository } from '../repositories/offChainSignedOrderRepository';
import { getOffChainOrderHashHex, getOffChainSignedOrderHashHex } from '../utils/offChainOrderHash';
import { EventPubSub } from './eventPubSub';
import { OrderEvent, OrderUpdate, ORDER_FILL_EVENT, ORDER_UPDATED } from '../types/events';

@Service()
export class PaymentNetworkService {
  
    /**
     * Creates an instance of PaymentNetworkService.
     * @param {UserTokenBalanceRepository} userTokenBalanceRepository 
     * @param {OffChainSignedOrderRepository} offChainSignedOrderRepository 
     * @param {EventPubSub} pubSubClient
     * @memberof PaymentNetworkService
     */
    constructor(
        @OrmRepository(UserTokenBalanceEntity)
        private userTokenBalanceRepository: UserTokenBalanceRepository,
        @OrmRepository(PaymentChannelSignedOrderEntity)
        private offChainSignedOrderRepository: OffChainSignedOrderRepository,
        private pubSubClient: EventPubSub
    ) { }
    
    /**
     * Get user token balances or throw if user address not found.
     * @param {string} address 
     * @returns {Promise<TokenBalances>} 
     * @memberof PaymentNetworkService
     */
    getUserTokenBalances(address: string): Promise<TokenBalances> {
        return this.userTokenBalanceRepository
            .getTokenBalances(address.toLowerCase())
            .catch(e => { throw e; });
    }

    /**
     * For testing purposes only. Set token balances for a particular user.
     * @param {string} address 
     * @param {TokenBalances} tokenBalances 
     * @returns {Promise<TokenBalances>} 
     * @memberof PaymentNetworkService
     */
    setUserTokenBalances(address: string, tokenBalances: TokenBalances): Promise<TokenBalances> {
        return this.userTokenBalanceRepository
            .setTokenBalances(address.toLowerCase(), tokenBalances)
            .catch(e => { throw e; });
    }

    /**
     * Get enriched signed order from repository or throw if no entities found.
     * @param {string} orderHashHex 
     * @returns {Promise<EnrichedSignedOrder>} 
     * @memberof PaymentNetworkService
     */
    getEnrichedOffChainSignedOrder(orderHashHex: string): Promise<EnrichedSignedOrder> {
        return this.offChainSignedOrderRepository
            .getEnrichedSignedOrder(orderHashHex)
            .catch(e => { throw e; });
    }

    /**
     * Fill order or throw if takerFillAmount exceeds taker amount in order or if maker or taker
     * have insufficient balance 
     * @param {OffChainSignedOrder} offChainSignedOrder 
     * @param {BigNumber} takerFillAmount 
     * @returns {Promise<void>} 
     * @memberof PaymentNetworkService
     */
    async fillOrderOrThrow(fillOrderRequest: OffChainFillOrderRequest): Promise<void> {
        const offChainSignedOrder: OffChainSignedOrder = fillOrderRequest.signedOrder;
        const takerAddress: string = fillOrderRequest.takerAddress;
        const takerFillAmount: BigNumber = fillOrderRequest.takerFillAmount;

        // TODO: Perform signed order validation
        const rate = offChainSignedOrder.makerTokenAmount.dividedBy(offChainSignedOrder.takerTokenAmount);
        const makerFillAmount = rate.mul(offChainSignedOrder.makerTokenAmount);

        const orderHashHex = getOffChainOrderHashHex(offChainSignedOrder);
        
        let enrichedOrder: EnrichedSignedOrder;
        try {
            enrichedOrder = await this.getEnrichedOffChainSignedOrder(orderHashHex);
        } catch (e) {
            enrichedOrder = {
                signedOrder: offChainSignedOrder,
                remainingMakerTokenAmount: offChainSignedOrder.makerTokenAmount,
                remainingTakerTokenAmount: offChainSignedOrder.takerTokenAmount
            };
        }
        
        if (offChainSignedOrder.makerTokenAmount.lessThanOrEqualTo(makerFillAmount)
            || offChainSignedOrder.takerTokenAmount.lessThanOrEqualTo(takerFillAmount)
        ) {
            enrichedOrder.remainingMakerTokenAmount = enrichedOrder.remainingMakerTokenAmount.minus(makerFillAmount);
            enrichedOrder.remainingTakerTokenAmount = enrichedOrder.remainingTakerTokenAmount.minus(takerFillAmount);

            await this.offChainSignedOrderRepository.addOrUpdateOrder(enrichedOrder, orderHashHex);

            await this.userTokenBalanceRepository.swapTokens(
                offChainSignedOrder.maker,
                offChainSignedOrder.makerTokenAddress,
                makerFillAmount,
                takerAddress,
                offChainSignedOrder.takerTokenAddress,
                takerFillAmount
            )
            .catch(e => { throw e; });

            const orderEvent: OrderEvent<OrderUpdate> = {
                type: ORDER_FILL_EVENT,
                payload: {
                    order: enrichedOrder.signedOrder,
                    remainingFillableMakerAmount: enrichedOrder.remainingMakerTokenAmount,
                    remainingFillableTakerAmount: enrichedOrder.remainingTakerTokenAmount
                }
            };
            this.pubSubClient.publish(ORDER_UPDATED, orderEvent);
        }
    }

    /**
     * Batch fill orders up to the taker amount or the maximum liquidity offered by the provided
     * orders. Should the taker's balance be less than their fill quantity, orders will be filled
     * up to the taker's balance.
     * @param {OffChainBatchFillOrderRequest} request 
     * @returns {Promise<OrderFilledQuantities>} 
     * @memberof PaymentNetworkService
     */
    async batchFillUpTo(request: OffChainBatchFillOrderRequest): Promise<OrderFilledQuantities> {
        let remainingFillableTakerAmount = request.takerFillAmount;
        let filledMakerAmount = new BigNumber(0);

        for (let i = 0; i < request.signedOrders.length; i++) {
            if (!remainingFillableTakerAmount.greaterThan(0)) {
                break;
            }
    
            const order = request.signedOrders[i];

            const fillOrder: OffChainFillOrder = {
                signedOrder: order,
                takerAddress: request.takerAddress,
                takerFillAmount: remainingFillableTakerAmount
            };

            try {
                const orderFilledQuantities: OrderFilledQuantities = await this.fillOrderUpToOrThrow(fillOrder);
                
                remainingFillableTakerAmount = remainingFillableTakerAmount.minus(
                    orderFilledQuantities.filledTakerAmount
                );
                
                filledMakerAmount = filledMakerAmount.add(orderFilledQuantities.filledMakerAmount);
            } catch (e) { 
                console.log(e);
            }
        }

        const filledQuantities: OrderFilledQuantities = {
            filledMakerAmount: filledMakerAmount,
            filledTakerAmount: request.takerFillAmount.minus(remainingFillableTakerAmount)
        };

        return filledQuantities;
    }

    /**
     * Gets order status of an order that has been partially or fully cancelled or filled. If
     * an order has never been filled or cancelled, an exception is thrown.
     * @param {string} orderHash 
     * @returns {Promise<OffChainSignedOrderStatus>} 
     * @memberof PaymentNetworkService
     */
    getOrderStatus(signedOrder: OffChainSignedOrder): Promise<OffChainSignedOrderStatus> {
        const orderHash = getOffChainOrderHashHex(signedOrder);

        return this.offChainSignedOrderRepository
            .getEnrichedSignedOrder(orderHash)
            .then((order: EnrichedSignedOrder) => {
                const orderStatus: OffChainSignedOrderStatus = {
                    orderHash: orderHash,
                    isValid: (order.remainingMakerTokenAmount.gt(0) && order.remainingTakerTokenAmount.gt(0)),
                    signedOrder: order.signedOrder,
                    remainingFillableMakerTokenAmount: order.remainingMakerTokenAmount,
                    remainingFillableTakerTokenAmount: order.remainingTakerTokenAmount
                };
                return orderStatus;
            })
            .catch(e => {
                const orderStatus: OffChainSignedOrderStatus = {
                    orderHash: orderHash,
                    isValid: true,
                    signedOrder: signedOrder,
                    remainingFillableMakerTokenAmount: signedOrder.makerTokenAmount,
                    remainingFillableTakerTokenAmount: signedOrder.takerTokenAmount
                };
                return orderStatus;
            }
        );
    }

    /**
     * To be only used internally - assumes order validation has taken place. Fill order up to either the 
     * taker amount or the order's remaining fillable taker amount. Throw if taker or maker have 
     * insufficient balance to fill order.
     * @param {OffChainFillOrderRequest} fillOrderRequest 
     * @returns {Promise<OrderFilledQuantities>} 
     * @memberof PaymentNetworkService
     */
    private async fillOrderUpToOrThrow(fillOrder: OffChainFillOrder): Promise<OrderFilledQuantities> {
        const offChainSignedOrder: OffChainSignedOrder = fillOrder.signedOrder;
        const takerAddress: string = fillOrder.takerAddress;
        const takerFillAmount: BigNumber = fillOrder.takerFillAmount;

        // Needs to be rounded to int because decimals don't exist on Ethereum
        const makerFillAmount 
            = offChainSignedOrder.makerTokenAmount
                                 .mul(takerFillAmount)
                                 .dividedToIntegerBy(offChainSignedOrder.takerTokenAmount);

        const orderHashHex = getOffChainOrderHashHex(offChainSignedOrder);
        
        let enrichedOrder: EnrichedSignedOrder;
        try {
            enrichedOrder = await this.getEnrichedOffChainSignedOrder(orderHashHex);
        } catch (e) {
            enrichedOrder = {
                signedOrder: offChainSignedOrder,
                remainingMakerTokenAmount: offChainSignedOrder.makerTokenAmount,
                remainingTakerTokenAmount: offChainSignedOrder.takerTokenAmount
            };
        }
        
        const makerFillableAmount: BigNumber = BigNumber.min(makerFillAmount, enrichedOrder.remainingMakerTokenAmount);
        const takerFillableAmount: BigNumber = BigNumber.min(takerFillAmount, enrichedOrder.remainingTakerTokenAmount);

        enrichedOrder.remainingMakerTokenAmount = enrichedOrder.remainingMakerTokenAmount.minus(makerFillableAmount);
        enrichedOrder.remainingTakerTokenAmount = enrichedOrder.remainingTakerTokenAmount.minus(takerFillableAmount);

        await this.offChainSignedOrderRepository.addOrUpdateOrder(enrichedOrder, orderHashHex);

        await this.userTokenBalanceRepository.swapTokens(
            offChainSignedOrder.maker,
            offChainSignedOrder.makerTokenAddress,
            makerFillAmount,
            takerAddress,
            offChainSignedOrder.takerTokenAddress,
            takerFillAmount
        )
        .catch(e => { throw e; });

        const orderEvent: OrderEvent<OrderUpdate> = {
            type: ORDER_FILL_EVENT,
            payload: {
                order: enrichedOrder.signedOrder,
                remainingFillableMakerAmount: enrichedOrder.remainingMakerTokenAmount,
                remainingFillableTakerAmount: enrichedOrder.remainingTakerTokenAmount
            }
        };

        this.pubSubClient.publish(ORDER_UPDATED, orderEvent);

        const orderFilledQuantities: OrderFilledQuantities = {
            filledMakerAmount: makerFillableAmount,
            filledTakerAmount: takerFillableAmount
        };

        return orderFilledQuantities;
    }

}
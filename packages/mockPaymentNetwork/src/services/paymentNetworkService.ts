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
    FillOrderRequest, 
    OffChainSignedOrderStatus 
} from '../types/schemas';
import { promisify } from 'util';
import { OffChainSignedOrderEntity } from '../entities/offChainSignedOrderEntity';
import { OffChainSignedOrderRepository } from '../repositories/offChainSignedOrderRepository';
import { getOffChainOrderHashHex } from '../utils/offChainOrderHash';
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
        @OrmRepository(OffChainSignedOrderEntity)
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
            .getTokenBalances(address)
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
            .setTokenBalances(address, tokenBalances)
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
     * Fill Order or throw if takerFillAmount exceeds taker amount in order or if maker or taker
     * have insufficient balance 
     * @param {OffChainSignedOrder} offChainSignedOrder 
     * @param {BigNumber} takerFillAmount 
     * @returns {Promise<void>} 
     * @memberof PaymentNetworkService
     */
    async fillOrder(fillOrderRequest: FillOrderRequest): Promise<void> {
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
            enrichedOrder.remainingMakerTokenAmount.minus(makerFillAmount);
            enrichedOrder.remainingTakerTokenAmount.minus(takerFillAmount);

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

    getOrderStatus(orderHash: string): Promise<OffChainSignedOrderStatus> {
        return this.getEnrichedOffChainSignedOrder(orderHash)
            .then((order: EnrichedSignedOrder) => {
                const orderStatus: OffChainSignedOrderStatus = {
                    orderHash: orderHash,
                    isValid: (order.remainingMakerTokenAmount.gt(0) && order.remainingTakerTokenAmount.gt(0)),
                    signedOrder: order.signedOrder,
                    remainingFillableMakerTokenAmount: order.remainingMakerTokenAmount,
                    remainingFillableTakerTokenAmount: order.remainingTakerTokenAmount
                };

                return orderStatus;
            }
        )
        .catch(e => { throw e; });
    }

}
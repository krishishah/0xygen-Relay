import { Repository, EntityRepository, Connection } from 'typeorm';
import { PaymentChannelSignedOrderEntity } from '../entities/paymentChannelSignedOrderEntity';
import { SignedOrder } from '0x.js';
import { BigNumber } from 'bignumber.js';
import { ECSignature } from '@0xproject/types';
import { Service } from 'typedi';
import { OrmConnection, OrmRepository } from 'typeorm-typedi-extensions';
import { EventPubSub } from '../services/eventPubSub';
import { EnrichedSignedOrder, OffChainSignedOrder } from '../types/schemas';

@Service()
@EntityRepository(PaymentChannelSignedOrderEntity)
export class OffChainSignedOrderRepository extends Repository<PaymentChannelSignedOrderEntity> {

    public async addOrUpdateOrder(
        enrichedSignedOrder: EnrichedSignedOrder, 
        orderHashHex: string
    ): Promise<EnrichedSignedOrder> {
        const entity = this.toSignedOrderEntity(enrichedSignedOrder, orderHashHex);
        return this.save(entity).then(_ => enrichedSignedOrder);
    }

    public getSignedOrder(orderHashHex: string): Promise<OffChainSignedOrder> {
        return this.findOne({orderHashHex: orderHashHex})
            .then(signedOrderEntity => {
                if (!signedOrderEntity) {
                    throw Error;
                }
                return this.toSignedOrder(signedOrderEntity);
            })
            .catch(error => {
                throw error;
            }
        );
    }

    public getEnrichedSignedOrder(orderHashHex: string): Promise<EnrichedSignedOrder> {
        return this.findOne({orderHashHex: orderHashHex})
            .then(signedOrderEntity => {
                if (!signedOrderEntity) {
                    throw Error;
                }
                return this.toEnrichedSignedOrder(signedOrderEntity);
            })
            .catch(error => {
                throw error;
            }
        );
    }

    public removeEnrichedSignedOrder(
        enrichedSignedOrder: EnrichedSignedOrder, 
        orderHashHex: string
    ): Promise<OffChainSignedOrder> {
        return this.remove(
            this.toSignedOrderEntity(
                enrichedSignedOrder, 
                orderHashHex
            )
        )
        .then(entity => this.toSignedOrder(entity));
    }

    public removeSignedOrderByHashHex(orderHashHex: string): Promise<void> {
        return this.delete({ orderHashHex: orderHashHex });
    }

    private toSignedOrderEntity(
        enrichedSignedOrder: EnrichedSignedOrder, 
        orderHashHex: string
    ): PaymentChannelSignedOrderEntity {
        try {
            const signedOrderEntity: PaymentChannelSignedOrderEntity = {
                ECSignatureV: enrichedSignedOrder.signedOrder.ecSignature.v.toString(),
                ECSignatureR: enrichedSignedOrder.signedOrder.ecSignature.r,
                ECSignatureS: enrichedSignedOrder.signedOrder.ecSignature.s,
                maker: enrichedSignedOrder.signedOrder.maker,
                taker: enrichedSignedOrder.signedOrder.taker,
                makerTokenAmount: enrichedSignedOrder.signedOrder.makerTokenAmount.toString(),
                takerTokenAmount: enrichedSignedOrder.signedOrder.takerTokenAmount.toString(),
                makerTokenAddress: enrichedSignedOrder.signedOrder.makerTokenAddress,
                takerTokenAddress: enrichedSignedOrder.signedOrder.takerTokenAddress,
                salt: enrichedSignedOrder.signedOrder.salt.toString(),
                expirationUnixTimestampSec: enrichedSignedOrder.signedOrder.expirationUnixTimestampSec.toString(),
                orderHashHex: orderHashHex,
                remainingMakerTokenAmount: enrichedSignedOrder.remainingMakerTokenAmount.toString(),
                remainingTakerTokenAmount: enrichedSignedOrder.remainingTakerTokenAmount.toString()
            };
            return signedOrderEntity;
        } catch (e) {
            console.log(e);
        }

    }

    private toEnrichedSignedOrder(signedOrderEntity: PaymentChannelSignedOrderEntity): EnrichedSignedOrder {       
        try {
            const ecSignature: ECSignature = {
                r: signedOrderEntity.ECSignatureR,
                s: signedOrderEntity.ECSignatureS,
                v: Number(signedOrderEntity.ECSignatureV)
            };

            const signedOrder: OffChainSignedOrder = {
                ecSignature: ecSignature,
                maker: signedOrderEntity.maker,
                taker: signedOrderEntity.taker,
                makerTokenAmount: new BigNumber(signedOrderEntity.makerTokenAmount),
                takerTokenAmount: new BigNumber(signedOrderEntity.takerTokenAmount),
                makerTokenAddress: signedOrderEntity.makerTokenAddress,
                takerTokenAddress: signedOrderEntity.takerTokenAddress,
                salt: new BigNumber(signedOrderEntity.salt),
                expirationUnixTimestampSec: new BigNumber(signedOrderEntity.expirationUnixTimestampSec)
            };

            const enrichedSignedOrder: EnrichedSignedOrder = {
                signedOrder,
                remainingMakerTokenAmount: new BigNumber(signedOrderEntity.remainingMakerTokenAmount),
                remainingTakerTokenAmount: new BigNumber(signedOrderEntity.remainingTakerTokenAmount)
            };

            return enrichedSignedOrder;

        } catch (e) {
            console.log(e);
        }
    }

    private toSignedOrder(signedOrderEntity: PaymentChannelSignedOrderEntity): OffChainSignedOrder {       
        try {
            const ecSignature: ECSignature = {
                r: signedOrderEntity.ECSignatureR,
                s: signedOrderEntity.ECSignatureS,
                v: Number(signedOrderEntity.ECSignatureV)
            };

            const signedOrder: OffChainSignedOrder = {
                ecSignature: ecSignature,
                maker: signedOrderEntity.maker,
                taker: signedOrderEntity.taker,
                makerTokenAmount: new BigNumber(signedOrderEntity.makerTokenAmount),
                takerTokenAmount: new BigNumber(signedOrderEntity.takerTokenAmount),
                makerTokenAddress: signedOrderEntity.makerTokenAddress,
                takerTokenAddress: signedOrderEntity.takerTokenAddress,
                salt: new BigNumber(signedOrderEntity.salt),
                expirationUnixTimestampSec: new BigNumber(signedOrderEntity.expirationUnixTimestampSec)
            };

            return signedOrder;

        } catch (e) {
            console.log(e);
        }
    }
}
import { Repository, EntityRepository, Connection } from 'typeorm';
import { OffChainSignedOrderEntity } from '../entities/offChainSignedOrderEntity';
import { SignedOrder } from '0x.js';
import { BigNumber } from 'bignumber.js';
import { ECSignature } from '@0xproject/types';
import { Service } from 'typedi';
import { OrmConnection, OrmRepository } from 'typeorm-typedi-extensions';
import { EventPubSub } from '../services/eventPubSub';
import { EnrichedSignedOrder, OffChainSignedOrder, OffChainEnrichedSignedOrder } from '../types/schemas';
import { OffChainEnrichedSignedOrderCompare } from '../utils/signedOrderCompare';

@Service()
@EntityRepository(OffChainSignedOrderEntity)
export class OffChainSignedOrderRepository extends Repository<OffChainSignedOrderEntity> {

    public async addOrUpdateOrder(
        enrichedSignedOrder: OffChainEnrichedSignedOrder, 
        orderHashHex: string
    ): Promise<OffChainEnrichedSignedOrder> {
        const entity = this.toSignedOrderEntity(enrichedSignedOrder, orderHashHex);
        return this.save(entity).then(_ => enrichedSignedOrder);
    }

    public getOffChainSignedOrder(orderHashHex: string): Promise<OffChainSignedOrder> {
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

    public getOffChainEnrichedSignedOrder(orderHashHex: string): Promise<OffChainEnrichedSignedOrder> {
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

    public getEnrichedTokenPairOrders(
        makerTokenAddress: string, 
        takerTokenAddress: string
    ): Promise<OffChainEnrichedSignedOrder[]> {
        return this.find(
            {
                makerTokenAddress: makerTokenAddress, 
                takerTokenAddress: takerTokenAddress
            }
        )
        .then(signedOrderEntities => {
            return signedOrderEntities
                .map(
                    signedOrder => this.toEnrichedSignedOrder(signedOrder)
                ).sort(
                    OffChainEnrichedSignedOrderCompare
                );
            }
        );
    }

    public getAllEnrichedSignedOrders(): Promise<OffChainEnrichedSignedOrder[]> {
        return this.find({}).then(signedOrderEntities => {
            return signedOrderEntities.map(order => {
                return this.toEnrichedSignedOrder(order);
            })
            .sort(OffChainEnrichedSignedOrderCompare);
        });
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
        enrichedSignedOrder: OffChainEnrichedSignedOrder, 
        orderHashHex: string
    ): OffChainSignedOrderEntity {
        try {
            const signedOrderEntity: OffChainSignedOrderEntity = {
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

    private toEnrichedSignedOrder(signedOrderEntity: OffChainSignedOrderEntity): OffChainEnrichedSignedOrder {       
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

            const enrichedSignedOrder: OffChainEnrichedSignedOrder = {
                signedOrder,
                remainingMakerTokenAmount: new BigNumber(signedOrderEntity.remainingMakerTokenAmount),
                remainingTakerTokenAmount: new BigNumber(signedOrderEntity.remainingTakerTokenAmount)
            };

            return enrichedSignedOrder;

        } catch (e) {
            console.log(e);
        }
    }

    private toSignedOrder(signedOrderEntity: OffChainSignedOrderEntity): OffChainSignedOrder {       
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
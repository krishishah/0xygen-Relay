import { Repository, EntityRepository, Connection } from 'typeorm';
import { SignedOrderEntity } from '../entities/signedOrderEntity';
import { SignedOrder } from '0x.js';
import { BigNumber } from 'bignumber.js';
import { ECSignature } from '@0xproject/types';
import { Service } from 'typedi';
import { OrmConnection, OrmRepository } from 'typeorm-typedi-extensions';
import { enrichedSignedOrderCompare } from '../utils/signedOrderCompare';
import { EventPubSub } from '../services/eventPubSub';
import { EnrichedSignedOrder } from '../types/schemas';

@Service()
@EntityRepository(SignedOrderEntity)
export class SignedOrderRepository extends Repository<SignedOrderEntity> {

    public async addOrUpdateOrder(
        enrichedSignedOrder: EnrichedSignedOrder, 
        orderHashHex: string
    ): Promise<EnrichedSignedOrder> {
        const entity = this.toSignedOrderEntity(enrichedSignedOrder, orderHashHex);
        return this.save(entity).then(_ => enrichedSignedOrder);
    }

    public getSignedOrder(orderHashHex: string): Promise<SignedOrder> {
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

    public getEnrichedTokenPairOrders(
        makerTokenAddress: string, 
        takerTokenAddress: string
    ): Promise<EnrichedSignedOrder[]> {
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
                    enrichedSignedOrderCompare
                );
            }
        );
    }

    public getAllEnrichedSignedOrders(): Promise<EnrichedSignedOrder[]> {
        return this.find({}).then(signedOrderEntities => {
            return signedOrderEntities.map(order => {
                return this.toEnrichedSignedOrder(order);
            })
            .sort(enrichedSignedOrderCompare);
        });
    }

    public removeEnrichedSignedOrder(
        enrichedSignedOrder: EnrichedSignedOrder, 
        orderHashHex: string
    ): Promise<SignedOrder> {
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
    ): SignedOrderEntity {
        try {
            const signedOrderEntity: SignedOrderEntity = {
                ECSignatureV: enrichedSignedOrder.signedOrder.ecSignature.v.toString(),
                ECSignatureR: enrichedSignedOrder.signedOrder.ecSignature.r,
                ECSignatureS: enrichedSignedOrder.signedOrder.ecSignature.s,
                maker: enrichedSignedOrder.signedOrder.maker,
                taker: enrichedSignedOrder.signedOrder.taker,
                makerFee: enrichedSignedOrder.signedOrder.makerFee.toString(),
                takerFee: enrichedSignedOrder.signedOrder.takerFee.toString(),
                makerTokenAmount: enrichedSignedOrder.signedOrder.makerTokenAmount.toString(),
                takerTokenAmount: enrichedSignedOrder.signedOrder.takerTokenAmount.toString(),
                makerTokenAddress: enrichedSignedOrder.signedOrder.makerTokenAddress,
                takerTokenAddress: enrichedSignedOrder.signedOrder.takerTokenAddress,
                salt: enrichedSignedOrder.signedOrder.salt.toString(),
                exchangeContractAddress: enrichedSignedOrder.signedOrder.exchangeContractAddress,
                feeRecipient: enrichedSignedOrder.signedOrder.feeRecipient,
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

    private toEnrichedSignedOrder(signedOrderEntity: SignedOrderEntity): EnrichedSignedOrder {       
        try {
            const ecSignature: ECSignature = {
                r: signedOrderEntity.ECSignatureR,
                s: signedOrderEntity.ECSignatureS,
                v: Number(signedOrderEntity.ECSignatureV)
            };

            const signedOrder: SignedOrder = {
                ecSignature: ecSignature,
                maker: signedOrderEntity.maker,
                taker: signedOrderEntity.taker,
                makerFee: new BigNumber(signedOrderEntity.makerFee),
                takerFee: new BigNumber(signedOrderEntity.takerFee),
                makerTokenAmount: new BigNumber(signedOrderEntity.makerTokenAmount),
                takerTokenAmount: new BigNumber(signedOrderEntity.takerTokenAmount),
                makerTokenAddress: signedOrderEntity.makerTokenAddress,
                takerTokenAddress: signedOrderEntity.takerTokenAddress,
                salt: new BigNumber(signedOrderEntity.salt),
                exchangeContractAddress: signedOrderEntity.exchangeContractAddress,
                feeRecipient: signedOrderEntity.feeRecipient,
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

    private toSignedOrder(signedOrderEntity: SignedOrderEntity): SignedOrder {       
        try {
            const ecSignature: ECSignature = {
                r: signedOrderEntity.ECSignatureR,
                s: signedOrderEntity.ECSignatureS,
                v: Number(signedOrderEntity.ECSignatureV)
            };

            const signedOrder: SignedOrder = {
                ecSignature: ecSignature,
                maker: signedOrderEntity.maker,
                taker: signedOrderEntity.taker,
                makerFee: new BigNumber(signedOrderEntity.makerFee),
                takerFee: new BigNumber(signedOrderEntity.takerFee),
                makerTokenAmount: new BigNumber(signedOrderEntity.makerTokenAmount),
                takerTokenAmount: new BigNumber(signedOrderEntity.takerTokenAmount),
                makerTokenAddress: signedOrderEntity.makerTokenAddress,
                takerTokenAddress: signedOrderEntity.takerTokenAddress,
                salt: new BigNumber(signedOrderEntity.salt),
                exchangeContractAddress: signedOrderEntity.exchangeContractAddress,
                feeRecipient: signedOrderEntity.feeRecipient,
                expirationUnixTimestampSec: new BigNumber(signedOrderEntity.expirationUnixTimestampSec)
            };

            return signedOrder;

        } catch (e) {
            console.log(e);
        }
    }
}
import { Repository, EntityRepository, Connection } from 'typeorm';
import { SignedOrderEntity } from '../entities/signedOrderEntity';
import { SignedOrder } from '0x.js';
import { BigNumber } from 'bignumber.js';
import { ECSignature } from '@0xproject/types';
import { Service } from 'typedi';
import { OrmConnection, OrmRepository } from 'typeorm-typedi-extensions';
import { signedOrderCompare } from '../utils/signedOrderCompare';
import { EventPubSub } from '../services/eventPubSub';

@Service()
@EntityRepository(SignedOrderEntity)
export class SignedOrderRepository extends Repository<SignedOrderEntity> {

    public async addOrUpdateOrder(signedOrder: SignedOrder, orderHashHex: string): Promise<SignedOrder> {
        const entity = this.toSignedOrderEntity(signedOrder, orderHashHex);
        return this.save(entity).then(_ => signedOrder);
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

    public getTokenPairOrders(makerTokenAddress: string, takerTokenAddress: string): Promise<SignedOrder[]> {
        return this.find(
            {
                makerTokenAddress: makerTokenAddress, 
                takerTokenAddress: takerTokenAddress
            }
        )
        .then(signedOrderEntities => {
            return signedOrderEntities
                .map(
                    signedOrder => this.toSignedOrder(signedOrder)
                ).sort(
                    signedOrderCompare
                );
            }
        );
    }

    public getAllSignedOrders(): Promise<SignedOrder[]> {
        return this.find({}).then(signedOrderEntities => {
            return signedOrderEntities.map(signedOrder => this.toSignedOrder(signedOrder)).sort(signedOrderCompare);
        });
    }

    public removeSignedOrder(signedOrder: SignedOrder, orderHashHex: string): Promise<SignedOrder> {
        return this.remove(
            this.toSignedOrderEntity(
                signedOrder, 
                orderHashHex
            )
        )
        .then(entity => this.toSignedOrder(entity));
    }

    public removeSignedOrderByHashHex(orderHashHex: string): Promise<void> {
        return this.delete({ orderHashHex: orderHashHex });
    }

    private toSignedOrderEntity(signedOrder: SignedOrder, orderHashHex: string): SignedOrderEntity {
        try {
            const signedOrderEntity: SignedOrderEntity = {
                ECSignatureV: signedOrder.ecSignature.v.toString(),
                ECSignatureR: signedOrder.ecSignature.r,
                ECSignatureS: signedOrder.ecSignature.s,
                maker: signedOrder.maker,
                taker: signedOrder.taker,
                makerFee: signedOrder.makerFee.toString(),
                takerFee: signedOrder.takerFee.toString(),
                makerTokenAmount: signedOrder.makerTokenAmount.toString(),
                takerTokenAmount: signedOrder.takerTokenAmount.toString(),
                makerTokenAddress: signedOrder.makerTokenAddress,
                takerTokenAddress: signedOrder.takerTokenAddress,
                salt: signedOrder.salt.toString(),
                exchangeContractAddress: signedOrder.exchangeContractAddress,
                feeRecipient: signedOrder.feeRecipient,
                expirationUnixTimestampSec: signedOrder.expirationUnixTimestampSec.toString(),
                orderHashHex: orderHashHex
            };
            return signedOrderEntity;
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
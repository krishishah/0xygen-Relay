import { Repository, EntityRepository, Connection } from 'typeorm';
import { SignedOrderEntity } from '../entities/signedOrderEntity';
import { SignedOrder } from '0x.js';
import { BigNumber } from 'bignumber.js';
import { ECSignature } from '0x.js/lib/src/types';
import { Service } from 'typedi';
import { OrmConnection, OrmRepository } from 'typeorm-typedi-extensions';

@Service()
@EntityRepository(SignedOrderEntity)
export class SignedOrderRepository extends Repository<SignedOrderEntity> {

    public addSignedOrder(signedOrder: SignedOrder, orderHashHex: string): void {
        this.insert(this.toSignedOrderEntity(signedOrder, orderHashHex));
    }

    public getSignedOrder(orderHashHex: string): Promise<SignedOrder> {
        return this.findOne({orderHashHex: orderHashHex})
            .then(signedOrderEntity => {
                if (signedOrderEntity === undefined) {
                    throw Error;
                }
                return this.toSignedOrder(signedOrderEntity);
            })
            .catch(error => {
                throw error;
            });
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
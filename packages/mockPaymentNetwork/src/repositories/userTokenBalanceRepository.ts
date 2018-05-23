import { Repository, EntityRepository, Connection, TransactionManager, EntityManager } from 'typeorm';
import { UserTokenBalanceEntity } from '../entities/userTokenBalanceEntity';
import { SignedOrder } from '0x.js';
import { BigNumber } from 'bignumber.js';
import { ECSignature } from '@0xproject/types';
import { Service } from 'typedi';
import { OrmConnection, OrmRepository } from 'typeorm-typedi-extensions';
import { EnrichedSignedOrder, TokenBalances } from '../types/schemas';

@Service()
@EntityRepository(UserTokenBalanceEntity)
export class UserTokenBalanceRepository extends Repository<UserTokenBalanceEntity> {

    getTokenBalances(address: string): Promise<TokenBalances> {
        return this.find({address: address})
            .then((tokeBalanceEntities: UserTokenBalanceEntity[]) => {
                let tokenBalances: TokenBalances = new Map();
                tokeBalanceEntities.map(
                    entity => tokenBalances.set(
                        entity.tokenAddress, 
                        new BigNumber(entity.balance)
                    )
                );
                return tokenBalances;    
            })
            .catch(e => {
                console.log(`Can not retrieve token balances for ${address}\n${e}`);
                throw e;
            }
        );   
    }

    setTokenBalances(address: string, tokenBalances: TokenBalances): Promise<TokenBalances> {
        const entities: UserTokenBalanceEntity[] = [];
        
        tokenBalances.forEach((balance: BigNumber, tokenAddr: string) => {
            entities.push({
                address: address,
                tokenAddress: tokenAddr,
                balance: balance.toFixed()
            });
        });

        return this.save(entities).then(x => tokenBalances);
    }

    async swapTokens(
        makerAddress: string, 
        makerTokenAddr: string,
        makerTokenAmount: BigNumber,
        takerAddress: string,
        takerTokenAddr: string,
        takerTokenAmount: BigNumber,
        @TransactionManager() manager?: EntityManager
    ): Promise<void> {
        const entities: UserTokenBalanceEntity[] = [];
        
        const makerTokenEntity = await this.findOne({
            address: makerAddress,
            tokenAddress: makerTokenAddr
        });

        const makerTokenBalance = new BigNumber(makerTokenEntity.balance);
        if (makerTokenBalance.lessThan(makerTokenAmount)) {
            throw 'Maker balance too low!';
        }

        const takerTokenEntity = await this.findOne({
            address: takerAddress,
            tokenAddress: takerTokenAddr
        });

        const takerTokenBalance = new BigNumber(takerTokenEntity.balance);
        if (takerTokenBalance.lessThan(makerTokenAmount)) {
            throw 'Taker balance too low!';
        }

        let makerTakerTokenBalance;
        try {
            const makerTakerTokenEntity = await this.findOne({
                address: makerAddress,
                tokenAddress: takerTokenAddr
            });

            makerTakerTokenBalance = new BigNumber(makerTakerTokenEntity.balance);
        } catch (e) {
            // if they have no allowance for the token off chain
            makerTakerTokenBalance = new BigNumber(0);
        }

        let takerMakerTokenBalance;
        try {
            const takerMakerTokenEntity = await this.findOne({
                address: takerAddress,
                tokenAddress: makerTokenAddr
            });

            takerMakerTokenBalance = new BigNumber(takerMakerTokenEntity.balance);
        } catch (e) {
            // if they have no allowance for the token off chain
            takerMakerTokenBalance = new BigNumber(0);
        }

        manager.transaction(async (entityManager: EntityManager) => {
            await entityManager.save({
                address: makerAddress,
                tokenAddress: makerTokenAddr,
                balance: makerTokenBalance.minus(makerTokenAmount).toFixed()
            });

            await entityManager.save({
                address: makerAddress,
                tokenAddress: takerTokenAddr,
                balance: makerTakerTokenBalance.add(takerTokenAmount).toFixed()
            });
            await entityManager.save({
                address: takerAddress,
                tokenAddress: takerTokenAddr,
                balance: takerTokenBalance.minus(takerTokenAmount).toFixed()
            });
            await entityManager.save({
                address: takerAddress,
                tokenAddress: makerTokenAddr,
                balance: takerMakerTokenBalance.add(makerTokenAmount).toFixed()
            });
        });
        
        return;
    }

}
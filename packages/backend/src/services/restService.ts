import { ZeroEx,  } from '0x.js';
import { SignedOrderRepository } from '../repositories/signedOrderRepository';
import { BigNumber } from '@0xproject/utils/lib/configured_bignumber';
import { SignedOrder } from '0x.js/lib/src/types';
import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';
import { SchemaValidator } from '@0xproject/json-schemas';
import { SignedOrderEntity } from '../entities/signedOrderEntity';
import { ZeroExClient } from '../utils/zeroExClient';
import { TokenPairOrderbook } from '../types/tokenPairOrderbook';

@Service()
export class RestService {
  
    /**
     * Initialize the RestApiRouter
     */
    constructor(
        @OrmRepository(SignedOrderEntity)
        private orderRepository: SignedOrderRepository
    ) {}   

    public getTokenPairs() {
        return null;
    }
  
    public getOrderBook(baseTokenAddress: string, quoteTokenAddress: string): Promise<TokenPairOrderbook> {
        return Promise.all(
            [
                // Signed orders in the bids array have quote as the makerTokenAddress and base as the takerTokenAddress
                this.orderRepository.getTokenPairOrders(quoteTokenAddress, baseTokenAddress),
                this.orderRepository.getTokenPairOrders(baseTokenAddress, quoteTokenAddress) 
            ]
        )
        .then(tokenPairs => {
            const orderBook: TokenPairOrderbook = {
                bids: tokenPairs[0],
                asks: tokenPairs[1]
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
  
    public postOrder(order: SignedOrder) {
        let orderHashHex: string = ZeroEx.getOrderHashHex(order);

        return this.orderRepository
                   .addSignedOrder(order, orderHashHex);
    }

    public getTokens() {
        return null;
    }

  }
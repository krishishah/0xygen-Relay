import { ZeroEx,  } from '0x.js';
import { SignedOrderRepository } from '../repositories/signedOrderRepository';
import { BigNumber } from '@0xproject/utils/lib/configured_bignumber';
import { SignedOrder } from '0x.js/lib/src/types';
import { NullOrder } from '../models/nullOrder';
import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';

@Service()
export class RestService {
  
    /**
     * Initialize the RestApiRouter
     */
    constructor(
        @OrmRepository()
        private orderRepository: SignedOrderRepository
    ) {}   

    public getTokenPairs() {
        return null;
    }
  
    public getOrderBook() {
        return null;
    }
  
    public getOrders() {
        return null;
    }
  
    public getOrder(salt: BigNumber): Promise<SignedOrder | NullOrder> {
        return this.orderRepository.getSignedOrder(salt);
    }

    public getFees() {
        return null;
    }
  
    public postOrder(order: SignedOrder) {
        return null;
    }

    public getTokens() {
        return null;
    }

  }
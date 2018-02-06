import { Entity, Column, PrimaryColumn } from 'typeorm';
import { BigNumber } from 'bignumber.js';

@Entity()
export class SignedOrderEntity {
    
    @Column()
    ECSignatureV: string;
    
    @Column()
    ECSignatureR: string;
    
    @Column()
    ECSignatureS: string;

    @Column()
    maker: string;

    @Column()
    taker: string;

    @Column()
    makerFee: string;

    @Column()
    takerFee: string;

    @Column()
    makerTokenAmount: string;

    @Column()
    takerTokenAmount: string;

    @Column()
    makerTokenAddress: string;

    @Column()
    takerTokenAddress: string;

    @PrimaryColumn()
    salt: string;

    @Column()
    exchangeContractAddress: string;

    @Column()
    feeRecipient: string;

    @Column()
    expirationUnixTimestampSec: string;

}
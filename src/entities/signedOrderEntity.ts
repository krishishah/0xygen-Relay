import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity()
export class SignedOrderEntity {

    @PrimaryColumn()
    orderHashHex: string;
    
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

    @Column()
    salt: string;

    @Column()
    exchangeContractAddress: string;

    @Column()
    feeRecipient: string;

    @Column()
    expirationUnixTimestampSec: string;

}
import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity()
export class OffChainSignedOrderEntity {

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
    expirationUnixTimestampSec: string;

    @Column()
    remainingMakerTokenAmount: string;

    @Column()
    remainingTakerTokenAmount: string;
    
}
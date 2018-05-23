import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity()
export class UserTokenBalanceEntity {

    @PrimaryColumn()
    address: string;
    
    @PrimaryColumn()
    tokenAddress: string;
    
    @Column()
    balance: string;

}
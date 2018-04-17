import * as ProviderEngine from 'web3-provider-engine';
import * as FetchSubProvider from 'web3-provider-engine/subproviders/fetch';
import { ZeroEx, SignedOrder } from '0x.js';
import BigNumber from 'bignumber.js';
import * as chai from 'chai';
import chaiHttp = require('chai-http');
import { SignedOrderEntity } from '../src/entities/signedOrderEntity';
import { SerializerUtils } from '../src/utils/serialization';
import { SignedOrderSchema } from '../src/types/schemas';

// Configer Web3 engine.
const engine = new ProviderEngine();
// Compose our Providers, order matters - use the RedundantRPCSubprovider to route all other requests
engine.addProvider(new FetchSubProvider({ rpcUrl: 'http://localhost:8545' }));
// engine.on('block', function(block){
//     console.log('BLOCK CHANGED:', '#' + block.number.toString('hex'), '0x' + block.hash.toString('hex'));
// });
engine.start();

// Instantiate 0x.js instance
const zeroEx = new ZeroEx(engine, {networkId: 50});

// Number of decimals to use (for ETH and ZRX)
const DECIMALS = 18;

// Relayer endpoint
chai.use(chaiHttp);
const expect = chai.expect;
const hostport: string = 'http://localhost:3000';

const makeOrder = async () => {

    // Addresses
    const WETH_ADDRESS = await zeroEx.etherToken.getContractAddressIfExists(); // The wrapped ETH token contract
    const ZRX_ADDRESS = await zeroEx.exchange.getZRXTokenAddress(); // The ZRX token contract
    // The Exchange.sol address (0x exchange smart contract)
    const EXCHANGE_ADDRESS = await zeroEx.exchange.getContractAddress();

    // Getting list of accounts
    const accounts = await zeroEx.getAvailableAddressesAsync();
    console.log('accounts: ', accounts);

    // Set our addresses
    const [makerAddress, takerAddress] = accounts;
    console.log('taker address:', takerAddress);

    // Unlimited allowances to 0x proxy contract for maker and taker
    const setMakerAllowTxHash = await zeroEx.token.setUnlimitedProxyAllowanceAsync(ZRX_ADDRESS,  makerAddress);
    await zeroEx.awaitTransactionMinedAsync(setMakerAllowTxHash);
    console.log('Maker allowance mined...');

    // Generate order
    const order = {
        maker: makerAddress,
        taker: ZeroEx.NULL_ADDRESS,
        feeRecipient: ZeroEx.NULL_ADDRESS,
        makerTokenAddress: ZRX_ADDRESS,
        takerTokenAddress: WETH_ADDRESS,
        exchangeContractAddress: EXCHANGE_ADDRESS,
        salt: ZeroEx.generatePseudoRandomSalt(),
        makerFee: new BigNumber(0),
        takerFee: new BigNumber(0),
        makerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(0.2), DECIMALS),  // Base 18 decimals
        takerTokenAmount: ZeroEx.toBaseUnitAmount(new BigNumber(0.5), DECIMALS),  // Base 18 decimals
        expirationUnixTimestampSec: new BigNumber(Date.now() + 3600000),          // Valid for up to an hour
    };

    // Create orderHash
    const orderHash = ZeroEx.getOrderHashHex(order);

    // Signing orderHash -> ecSignature
    const ecSignature = await zeroEx.signOrderHashAsync(orderHash, makerAddress, false);

    // Appending signature to order
    const signedOrder = {
        ...order,
        ecSignature,
    };

    await chai.request(hostport).post('/v0/order').send(signedOrder);
    console.log('Submitted order:\n', signedOrder);
    console.log('order hash:\n', orderHash);

    return orderHash;
};

const takeOrder = async (signedOrderHashHex: string) => {

    // Addresses
    const WETH_ADDRESS = await zeroEx.etherToken.getContractAddressIfExists(); // The wrapped ETH token contract
    const ZRX_ADDRESS = await zeroEx.exchange.getZRXTokenAddress(); // The ZRX token contract
    // The Exchange.sol address (0x exchange smart contract)
    const EXCHANGE_ADDRESS = await zeroEx.exchange.getContractAddress();

    // Getting list of accounts
    const accounts = await zeroEx.getAvailableAddressesAsync();
    console.log('accounts: ', accounts);

    // Set our addresses
    const [makerAddress, takerAddress] = accounts;

    const setTakerAllowTxHash = await zeroEx.token.setUnlimitedProxyAllowanceAsync(WETH_ADDRESS, takerAddress);
    await zeroEx.awaitTransactionMinedAsync(setTakerAllowTxHash);
    console.log('Taker allowance mined...');

    // Deposit WETH
    const ethAmount = new BigNumber(1);
    const ethToConvert = ZeroEx.toBaseUnitAmount(ethAmount, DECIMALS); // Number of ETH to convert to WETH
    const convertEthTxHash = await zeroEx.etherToken.depositAsync(WETH_ADDRESS, ethToConvert, takerAddress);
    await zeroEx.awaitTransactionMinedAsync(convertEthTxHash);
    console.log(`${ethAmount} ETH -> WETH conversion mined...`);

    // Get order from relayer
    const signedOrder: SignedOrder = 
                await chai.request(hostport).get('/v0/order/' + signedOrderHashHex)
                          .then(res => {
                              const { body } = res;
                              let orderSchema = body as SignedOrderSchema;
                              return SerializerUtils.SignedOrderfromJSON(orderSchema);
                          });

    // Verify that order is fillable
    zeroEx.exchange.validateOrderFillableOrThrowAsync(signedOrder);

    // Try to fill order
    const shouldThrowOnInsufficientBalanceOrAllowance = true;
    const fillTakerTokenAmount = ZeroEx.toBaseUnitAmount(new BigNumber(0.1), DECIMALS);

    // Filling order
    const txHash = await zeroEx.exchange.fillOrderAsync(
        signedOrder, fillTakerTokenAmount, shouldThrowOnInsufficientBalanceOrAllowance, takerAddress,
    );

    // Transaction receipt
    const txReceipt = await zeroEx.awaitTransactionMinedAsync(txHash);
    console.log('FillOrder transaction receipt: ', txReceipt);
};

makeOrder().then(orderHash => {
    takeOrder(orderHash); 
}).catch(err => console.log);

import * as React from 'react';
import Welcome from '../../components/Welcome';
import Account from '../Account';
import Web3Actions from '../../components/Web3Actions';
import Faucet from '../../components/Faucet';
import { Dashboard } from '../../components/Dashboard';
import InstallMetamask from '../../components/InstallMetamask';
import * as Web3 from 'web3';
import * as RPCSubprovider from 'web3-provider-engine/subproviders/rpc';
import { Divider, Container, Segment, Card, Step, Icon, Grid } from 'semantic-ui-react';
import { InjectedWeb3Subprovider, RedundantRPCSubprovider } from '@0xproject/subproviders';
import { EasyTradeSteps } from '../../components/SimpleTradeSteps';
import GridColumn from 'semantic-ui-react/dist/commonjs/collections/Grid/GridColumn';
import { ZeroEx, Token } from '0x.js';
import * as _ from 'lodash';
import { BigNumber } from 'bignumber.js';
import { Dictionary } from 'lodash';
import { Web3Wrapper } from '@0xproject/web3-wrapper';

const Web3ProviderEngine = require('web3-provider-engine');

// Kovan is a test network
// Please ensure you have Metamask installed
// and it is connected to the Kovan test network
const KOVAN_NETWORK_ID = 42;
const KOVAN_RPC = 'https://kovan.infura.io';

const TEST_RPC_NETWORK_ID = 50;
const TEST_RPC = 'http://localhost:8545';

const ETHER_TOKEN_SYMBOL = 'ETH';
const ETHER_DECIMAL_PLACES = 18;

export interface TokenBalance {
    token: Token;
    balance: BigNumber;
}

interface Props { }

interface State {
    accounts: string[];
    tokenBalances: Dictionary<TokenBalance>;
    etherBalance: BigNumber;
}

export default class App extends React.Component<Props, State> {
    web3: Web3;
    providerEngine: any;
    zeroEx: ZeroEx;
    web3Wrapper: Web3Wrapper;

    constructor(props: Props) {
        super(props);

        this.state = { 
            accounts: [''], 
            tokenBalances: {},
            etherBalance: new BigNumber(0)
        };
    }

    componentDidMount() {
        this.initialiseState();
    }

    initialiseState = () => {
        if (typeof (window as any).web3 !== 'undefined') {
            // Add metamask subprovider to engine if it exists
            this.providerEngine = new Web3ProviderEngine();
            this.providerEngine.addProvider(new InjectedWeb3Subprovider((window as any).web3.currentProvider));
            this.providerEngine.addProvider(new RedundantRPCSubprovider([KOVAN_RPC]));
            this.providerEngine.start();
            this.web3Wrapper = new Web3Wrapper(this.providerEngine);
            this.zeroEx = new ZeroEx(this.providerEngine, { networkId: KOVAN_NETWORK_ID });
            this.web3 = new Web3(this.providerEngine);

            // Poll for the account details and keep it refreshed
            setInterval(() => {
                this.fetchAccountDetailsAsync();
            // tslint:disable-next-line:align
            }, 3000);
        }
    }

    fetchAccountDetailsAsync = async () => {
        // Get the Available Addresses from the Web3 Provider inside of ZeroEx
        const addresses: string[] = await this.zeroEx.getAvailableAddressesAsync();
        
        // Request all of the tokens and their details from the 0x Token Registry
        const tokens: Token[] = await this.zeroEx.tokenRegistry.getTokensAsync();
        
        // Get default account
        const address: string = addresses[0];
     
        if (!address) {
            return;
        }

        const userTokenBalances = {};
        
        // Fetch all the Balances for all of the tokens in the Token Registry
        const allTokenRegistryBalancesAsync = _.map(tokens, async (token: Token): Promise<TokenBalance> => {
            try {
                const balance = await this.zeroEx.token.getBalanceAsync(token.address, address);
                // const numberBalance = new BigNumber(balance);
                return { token: token, balance: balance };
            } catch (e) {
                console.log(e);
                return { token: token, balance: new BigNumber(0) };
            }
        });

        const allTokenRegistryBalances = await Promise.all(allTokenRegistryBalancesAsync);

        // Convert all of the Units into more Human Readable numbers
        // Many ERC20 tokens go to 18 decimal places
        _.each(allTokenRegistryBalances, (tokenBalance: TokenBalance) => {
            if (tokenBalance.balance && tokenBalance.balance.gt(0)) {
                tokenBalance.balance = ZeroEx.toUnitAmount(
                    tokenBalance.balance,
                    tokenBalance.token.decimals
                );
                userTokenBalances[tokenBalance.token.symbol] = tokenBalance;
            }
        });

        // Fetch the Balance in Ether
        try {
            let ethBalance = await this.web3Wrapper.getBalanceInWeiAsync(address);
            
            ethBalance = ZeroEx.toUnitAmount(
                ethBalance,
                ETHER_DECIMAL_PLACES
            );
            
            this.setState({etherBalance: ethBalance});
        } catch (e) {
            console.log(e);
        }

        // Update the state in React
        this.setState((prev, props) => {
            return { ...prev, tokenBalances: userTokenBalances, accounts: addresses };
        });
    };

    render() {
        // Detect if Web3 is found, if not, ask the user to install Metamask
        // tslint:disable-next-line:no-any
        if (typeof (window as any).web3 !== 'undefined') {
            return (
                <div style={{ padding: '4em' }}>
                    <Dashboard/>
                    <Card raised={true} centered={true} style={{ padding: '1em', minWidth: '1000px'}}>
                        <Card.Content>
                            <Card.Header>
                                <EasyTradeSteps/>
                            </Card.Header>
                        </Card.Content>
                    <Grid textAlign="center" columns="2">
                        <GridColumn>
                            <Card.Content>
                                <Faucet zeroEx={this.zeroEx} />
                            </Card.Content>
                            <Card.Content>
                                <Web3Actions web3={this.web3} />
                            </Card.Content>
                        </GridColumn>
                        <GridColumn>
                            <Card.Content>
                                <Account 
                                    web3={this.web3} 
                                    zeroEx={this.zeroEx} 
                                    accounts={this.state.accounts}
                                    tokenBalances={this.state.tokenBalances}
                                    etherBalance={this.state.etherBalance}
                                    fetchAccountDetailsAsync={this.fetchAccountDetailsAsync}
                                />
                            </Card.Content>
                        </GridColumn>
                    </Grid>
                    </Card>
                </div>
            );
        } else {
            return (
                <Card centered={true} style={{marginTop: '100px', padding: '2em', minWidth: '500px'}}>
                    <Card.Content>
                        <Card.Header>
                            <Welcome/>
                        </Card.Header>
                    </Card.Content>
                    <Card.Content>
                        <InstallMetamask/>
                    </Card.Content>
                </Card>
            );
        }
    }
}
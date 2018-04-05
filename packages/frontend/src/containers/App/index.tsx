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

const styles = {};

interface Props { }

interface State {
    accounts: string[];
    balances: Dictionary<Dictionary<BigNumber>>;
}

export interface TokenBalance {
    token: Token;
    balance: BigNumber;
}

const ETHER_TOKEN_NAME = 'ETH';

export default class App extends React.Component<Props, State> {
    web3: Web3;
    providerEngine: any;
    zeroEx: ZeroEx;
    web3Wrapper: Web3Wrapper;

    constructor(props: Props) {
        super(props);

        this.state = { 
            accounts: [''], 
            balances: {} 
        };

        this.initialiseState();
    }

    initialiseState = () => {
        this.providerEngine = new Web3ProviderEngine();
        this.providerEngine.addProvider(new RedundantRPCSubprovider([KOVAN_RPC]));
        this.providerEngine.start();
        this.web3Wrapper = new Web3Wrapper(this.providerEngine);
        this.web3 = new Web3(this.providerEngine);
        this.zeroEx = new ZeroEx(this.providerEngine, { networkId: KOVAN_NETWORK_ID });

        // Poll for the account details and keep it refreshed
        setInterval(() => {
            this.fetchAccountDetailsAsync();
        // tslint:disable-next-line:align
        }, 3000);
    }

    fetchAccountDetailsAsync = async () => {
        // Get the Available Addresses from the Web3 Provider inside of ZeroEx
        const addresses = await this.zeroEx.getAvailableAddressesAsync();
        // Request all of the tokens and their details from the 0x Token Registry
        const tokens = await this.zeroEx.tokenRegistry.getTokensAsync();
        const address = addresses[0];
        if (!address) {
            return;
        }
        const balances = {};
        balances[address] = {};
        // Fetch all the Balances for all of the tokens in the Token Registry
        const allBalancesAsync = _.map(tokens, async (token: Token): Promise<TokenBalance> => {
            try {
                const balance = await this.zeroEx.token.getBalanceAsync(token.address, address);
                const numberBalance = new BigNumber(balance);
                return { token: token, balance: numberBalance };
            } catch (e) {
                console.log(e);
                return { token: token, balance: new BigNumber(0) };
            }
        });

        // Convert all of the Units into more Human Readable numbers
        // Many ERC20 tokens go to 18 decimal places
        const results = await Promise.all(allBalancesAsync);
        _.each(results, (tokenBalance: TokenBalance) => {
            if (tokenBalance.balance && tokenBalance.balance.gt(0)) {
                balances[address][tokenBalance.token.name] = ZeroEx.toUnitAmount(
                    tokenBalance.balance,
                    tokenBalance.token.decimals
                );
            }
        });

        // Fetch the Balance in Ether
        try {
            const ethBalance = await this.web3Wrapper.getBalanceInWeiAsync(address);
            if (ethBalance) {
                const ethBalanceNumber = new BigNumber(ethBalance);
                balances[address][ETHER_TOKEN_NAME] = ZeroEx.toUnitAmount(new BigNumber(ethBalanceNumber), 18);
            }
        } catch (e) {
            console.log(e);
        }

        // Update the state in React
        this.setState((prev, props) => {
            return { ...prev, balances: balances, accounts: addresses };
        });
    };

    render() {
        // Detect if Web3 is found, if not, ask the user to install Metamask
        // tslint:disable-next-line:no-any
        if ((window as any).web3) {

            // Add metamask subprovider to engine if it exists
            this.providerEngine.addProvider(new InjectedWeb3Subprovider((window as any).web3.currentProvider));

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
                                    balances={this.state.balances}
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
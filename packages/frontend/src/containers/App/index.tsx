import * as React from 'react';
import Welcome from '../../components/Welcome';
import Account from '../Account';
import Web3Actions from '../../components/Web3Actions';
import Faucet from '../../components/Faucet';
import { Dashboard, UserWorflow } from '../../components/Dashboard';
import InstallMetamask from '../../components/InstallMetamask';
import * as Web3 from 'web3';
import * as RPCSubprovider from 'web3-provider-engine/subproviders/rpc';
import * as _ from 'lodash';
import { BigNumber } from 'bignumber.js';
import { Dictionary } from 'lodash';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import SetAllowances from '../Steps/Shared/SetAllowances';
import TradeTokens from '../Steps/Taker/TradeTokens';
import CreateOrder from '../Steps/Maker/CreateOrder';
import SubmitSignedOrder from '../Steps/Maker/SubmitSignedOrder';

import { 
    UserActionMessage, 
    UserActionMessageProps,
    UserActionMessageStatus
} from '../../components/UserActionMessage';
import { 
    Divider, 
    Container, 
    Segment, 
    Card, 
    Step, 
    Icon, 
    Grid, 
    DropdownItemProps, 
    Message,
    GridColumn,
    MenuItemProps
} from 'semantic-ui-react';
import { 
    InjectedWeb3Subprovider, 
    RedundantRPCSubprovider 
} from '@0xproject/subproviders';
import { 
    SimpleTakerTradeStepsHeader, 
    SimpleTakerTradeStep 
} from '../../components/SimpleTakerTradeSteps';
import { 
    SimpleMakerTradeStepsHeader, 
    SimpleMakerTradeStep 
} from '../../components/SimpleMakerTradeSteps';

import { 
    ZeroEx, 
    Token, 
    SignedOrder
} from '0x.js';
import { 
    KOVAN_RPC, 
    KOVAN_NETWORK_ID, 
    ETHER_DECIMAL_PLACES, 
    RELAYER_URL,   
    TEST_RPC, 
    TEST_RPC_NETWORK_ID 
} from '../../config';

const Web3ProviderEngine = require('web3-provider-engine');

export interface TokenBalance {
    token: Token;
    balance: BigNumber;
}

export interface TokenAllowance {
    token: Token;
    allowance: BigNumber;
}

interface Props {}

interface State {
    accounts: string[];
    tokenBalances: Dictionary<TokenBalance>;
    etherBalance: BigNumber;
    activeTakerStep: SimpleTakerTradeStep;
    activeMakerStep: SimpleMakerTradeStep;
    tokensWithAllowances: Dictionary<TokenAllowance>;
    zeroExRegistryTokens: Token[];
    transactionMessage: UserActionMessageProps;
    activeUserWorkflow: UserWorflow;
    submitableMakerSignedOrder: undefined | SignedOrder;
}

export default class App extends React.Component<Props, State> {

    providerEngine: any;
    zeroEx: ZeroEx;
    web3Wrapper: Web3Wrapper;

    constructor(props: Props) {
        super(props);

        this.state = { 
            accounts: [''], 
            tokenBalances: {},
            etherBalance: new BigNumber(0),
            activeTakerStep: 'Allowance',
            activeMakerStep: 'Allowance',
            tokensWithAllowances: {},
            zeroExRegistryTokens: [],
            transactionMessage: {
                message: '',
                status: 'NONE',
                dismissMessage: this.dismissTransactionMessage
            },
            activeUserWorkflow: 'Taker',
            submitableMakerSignedOrder: undefined
        };
    }

    componentWillMount() {
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
    }

    private fetchTokenAllowance = async (token: Token) => {
        const zeroEx: ZeroEx = this.zeroEx;
        const account = this.state.accounts[0];

        try {
            const allowance = await zeroEx.token.getProxyAllowanceAsync(token.address, account);
            return { token: token, allowance: allowance };
        } catch (e) {
            console.log(e);
            return { token: token, allowance: new BigNumber(0) };
        }
    }

    private setTokenAllowance = async (tokenAllowance: TokenAllowance) => {
        const zeroEx: ZeroEx = this.zeroEx;
        const account = this.state.accounts[0];
        
        if (tokenAllowance.allowance.equals(0)) {
            try {
                const txHash = await zeroEx.token.setUnlimitedProxyAllowanceAsync(
                    tokenAllowance.token.address, 
                    account
                );
            } catch (e) {
                console.log(e);
            }
        } else {
            try {
                const txHash = await zeroEx.token.setProxyAllowanceAsync(
                    tokenAllowance.token.address, 
                    account,
                    new BigNumber(0)
                );
            } catch (e) {
                console.log(e);
            }
        }
    }
    
    private fetchAllowances = async () => {
        const zeroEx: ZeroEx = this.zeroEx;
        const account = this.state.accounts[0];
        let tokensWithAllowances = this.state.tokensWithAllowances;

        const tokens = await this.zeroEx.tokenRegistry.getTokensAsync();

        const zeroExRegistryTokenAllowancePromises = _.map(tokens, async (token: Token): Promise<TokenAllowance> => {
            return await this.fetchTokenAllowance(token);
        });

        const zeroExRegistryTokenAllowances = await Promise.all(zeroExRegistryTokenAllowancePromises);

        // Convert all of the Units into more Human Readable numbers
        // Many ERC20 tokens go to 18 decimal places
        _.each(zeroExRegistryTokenAllowances, (tokenAllowance: TokenAllowance) => {
            if ((tokenAllowance.allowance && tokenAllowance.allowance.gt(0))
                || this.state.tokensWithAllowances[tokenAllowance.token.symbol]) {
                tokenAllowance.allowance = ZeroEx.toUnitAmount(
                    tokenAllowance.allowance,
                    tokenAllowance.token.decimals
                );
                tokensWithAllowances[tokenAllowance.token.symbol] = tokenAllowance;
            }
        });

        this.setState({
            tokensWithAllowances,
            zeroExRegistryTokens: tokens
        });
    }

    private changeTakerStep = async (newStep: SimpleTakerTradeStep) => {
        await this.setState({
            activeTakerStep: newStep
        });
    }

    private changeMakerStep = async (newStep: SimpleMakerTradeStep) => {
        await this.setState({
            activeMakerStep: newStep
        });
    }

    private dismissTransactionMessage = () => {
        this.setState({
            transactionMessage: {
                message: '',
                status: 'NONE',
                dismissMessage: this.dismissTransactionMessage
            }
        });
    }

    private setTransactionMessageState = (status: UserActionMessageStatus, message?: string) => {
        this.setState({
            transactionMessage: {
                message,
                status,
                dismissMessage: this.dismissTransactionMessage
            }
        });
    }

    private onChangeWorkflow = (event: React.MouseEvent<HTMLAnchorElement>, data: MenuItemProps) => {
        data.name === 'Order Taker' ? 
            this.setState({ activeUserWorkflow: 'Taker' }) 
        : 
            this.setState({ activeUserWorkflow: 'Maker' }); 
    }

    private renderMakerWorkflow = (): any => {
        let makerStepToRender;
        let activeMakerStep = this.state.activeMakerStep;

        switch (activeMakerStep) {
            case 'Allowance': {
                makerStepToRender = (
                    <SetAllowances 
                        zeroEx={this.zeroEx} 
                        accounts={this.state.accounts}
                        tokensWithAllowances={this.state.tokensWithAllowances}
                        zeroExRegistryTokens={this.state.zeroExRegistryTokens}
                        fetchAllowances={this.fetchAllowances}
                        setTokenAllowance={this.setTokenAllowance}
                        fetchTokenAllowance={this.fetchTokenAllowance}
                    />
                );
                break;
            }
            case 'CreateOrder': {
                makerStepToRender = (
                    <CreateOrder
                        zeroEx={this.zeroEx}
                        tokensWithAllowance={this.state.tokensWithAllowances} 
                        zeroExProxyTokens={this.state.zeroExRegistryTokens}
                        setTransactionMessageState={this.setTransactionMessageState}
                        accounts={this.state.accounts}
                        progressMakerStep={this.changeMakerStep}
                        setSubmitableSignedOrder={this.setSubmitableSignedOrder}
                    /> 
                );
                break;
            }
            // TODO: Figure out why this disappears after ive gone to a different step
            case 'SubmitOrder': {
                makerStepToRender = (
                    <SubmitSignedOrder
                        signedOrder={this.state.submitableMakerSignedOrder}
                        setTransactionMessageState={this.setTransactionMessageState}
                    />
                );
                break;
            }
            default:
                break;
        }

        return (
            <Card 
                raised={true} 
                centered={true} 
                style={{ padding: '1em 1em 1em 1em', margin: '4em 0em 4em 0em', minWidth: '1100px'}}
            >  
                <UserActionMessage 
                    status={this.state.transactionMessage.status} 
                    message={this.state.transactionMessage.message} 
                    dismissMessage={this.state.transactionMessage.dismissMessage}
                />
                <Card.Content>
                    <Card.Header>
                        <SimpleMakerTradeStepsHeader 
                            activeStep={this.state.activeMakerStep}
                            changeStep={this.changeMakerStep}
                            isSubmitOrderDisabled={this.state.submitableMakerSignedOrder === undefined}
                        />
                    </Card.Header>
                </Card.Content>
                <Grid columns="2" style={{height: '100%'}}>
                    <GridColumn style={{ padding: '2em 2em 2em 2em'}}>
                        <Card.Content style={{height: '100%'}}>
                            {makerStepToRender}
                        </Card.Content>
                    </GridColumn>
                    <GridColumn style={{ padding: '2em 2em 2em 2em'}}>
                        <Card.Content>
                            <Account 
                                accounts={this.state.accounts}
                                tokenBalances={this.state.tokenBalances}
                                etherBalance={this.state.etherBalance}
                                fetchAccountDetailsAsync={this.fetchAccountDetailsAsync}
                            />
                        </Card.Content>
                    </GridColumn>
                </Grid>
            </Card>
        );
    }

    private setSubmitableSignedOrder = async (signedOrder: SignedOrder) => {
        await this.setState({submitableMakerSignedOrder: signedOrder});
    }

    private renderTakerWorkflow = (): any => {
        let takerStepToRender;
        let activeTakerStep = this.state.activeTakerStep;

        switch (activeTakerStep) {
            case 'Allowance': {
                takerStepToRender = (
                    <SetAllowances 
                        zeroEx={this.zeroEx} 
                        accounts={this.state.accounts}
                        tokensWithAllowances={this.state.tokensWithAllowances}
                        zeroExRegistryTokens={this.state.zeroExRegistryTokens}
                        fetchAllowances={this.fetchAllowances}
                        setTokenAllowance={this.setTokenAllowance}
                        fetchTokenAllowance={this.fetchTokenAllowance}
                    />
                );
                break;
            }
            case 'Trade': {
                takerStepToRender = (
                    <TradeTokens 
                        zeroEx={this.zeroEx}
                        tokensWithAllowance={this.state.tokensWithAllowances} 
                        zeroExProxyTokens={this.state.zeroExRegistryTokens}
                        setTransactionMessageState={this.setTransactionMessageState}
                        accounts={this.state.accounts}
                    />
                );
                break;
            }
            default:
                break;
        }

        return (
            <Card 
                raised={true} 
                centered={true} 
                style={{ padding: '1em 1em 1em 1em', margin: '4em 0em 4em 0em', minWidth: '1100px'}}
            >  
                <UserActionMessage 
                    status={this.state.transactionMessage.status} 
                    message={this.state.transactionMessage.message} 
                    dismissMessage={this.state.transactionMessage.dismissMessage}
                />
                <Card.Content>
                    <Card.Header>
                        <SimpleTakerTradeStepsHeader 
                            activeStep={this.state.activeTakerStep}
                            changeStep={this.changeTakerStep}
                        />
                    </Card.Header>
                </Card.Content>
                <Grid columns="2" style={{height: '100%'}}>
                    <GridColumn style={{ padding: '2em 2em 2em 2em'}}>
                        <Card.Content style={{height: '100%'}}>
                            {takerStepToRender}
                        </Card.Content>
                    </GridColumn>
                    <GridColumn style={{ padding: '2em 2em 2em 2em'}}>
                        <Card.Content>
                            <Account 
                                accounts={this.state.accounts}
                                tokenBalances={this.state.tokenBalances}
                                etherBalance={this.state.etherBalance}
                                fetchAccountDetailsAsync={this.fetchAccountDetailsAsync}
                            />
                        </Card.Content>
                    </GridColumn>
                </Grid>
            </Card>
        );
    }

    // tslint:disable-next-line:member-ordering
    render() {
        // Detect if Web3 is found, if not, ask the user to install Metamask
        // tslint:disable-next-line:no-any
        if (typeof (window as any).web3 !== 'undefined') {

            let userWorkflow;
            if (this.state.activeUserWorkflow === 'Taker') {
                userWorkflow = this.renderTakerWorkflow();
            } else {
                userWorkflow = this.renderMakerWorkflow();
            }

            return (
                <Container>
                    <Dashboard
                        activeWorkflow={this.state.activeUserWorkflow}
                        onChangeWorkflow={this.onChangeWorkflow}
                    />
                    {userWorkflow}
                </Container>
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
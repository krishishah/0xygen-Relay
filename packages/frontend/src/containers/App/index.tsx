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
import ZeroExTradeTokens from '../Steps/Taker/ZeroEx/TradeTokens';
import OffChainTradeTokens from '../Steps/Taker/OffChain/TradeTokens';
import WrapEth from '../Steps/Taker/WrapEth';
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
    MenuItemProps,
    Button,
    ButtonProps
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
    RELAYER_ZERO_EX_WS_URL,   
    TEST_RPC, 
    TEST_RPC_NETWORK_ID 
} from '../../config';
import { PaymentNetworkRestfulClient } from '../../api/paymentNetwork/rest';
import { OffChainTokenBalances, OffChainSignedOrder } from '../../types';

const Web3ProviderEngine = require('web3-provider-engine');

export interface TokenBalance {
    token: Token;
    balance: BigNumber;
}

export interface TokenAllowance {
    token: Token;
    allowance: BigNumber;
}

export type UserSettlementWorkflow = 'Off-Chain' | 'On-Chain';

interface Props {}

interface State {
    accounts: string[];
    onChainTokenBalances: Dictionary<TokenBalance>;
    offChainTokenBalances: Dictionary<TokenBalance>;
    etherBalance: BigNumber;
    activeTakerStep: SimpleTakerTradeStep;
    activeMakerStep: SimpleMakerTradeStep;
    tokensWithAllowances: Dictionary<TokenAllowance>;
    zeroExRegistryTokens: Token[];
    transactionMessage: UserActionMessageProps;
    activeUserWorkflow: UserWorflow;
    submitableZeroExMakerSignedOrder: undefined | SignedOrder;
    submitableOffChainMakerSignedOrder: undefined | OffChainSignedOrder;
    activeSettlementWorkflow: UserSettlementWorkflow;
    
}

export default class App extends React.Component<Props, State> {

    providerEngine: any;
    zeroEx: ZeroEx;
    web3Wrapper: Web3Wrapper;
    paymentNetworkRestClient: PaymentNetworkRestfulClient | null;

    constructor(props: Props) {
        super(props);

        this.state = { 
            accounts: [''], 
            onChainTokenBalances: {},
            offChainTokenBalances: {},
            etherBalance: new BigNumber(0),
            activeTakerStep: 'WrapEth',
            activeMakerStep: 'Allowance',
            tokensWithAllowances: {},
            zeroExRegistryTokens: [],
            transactionMessage: {
                message: '',
                status: 'NONE',
                dismissMessage: this.dismissTransactionMessage
            },
            activeUserWorkflow: 'Taker',
            submitableZeroExMakerSignedOrder: undefined,
            submitableOffChainMakerSignedOrder: undefined,
            activeSettlementWorkflow: 'On-Chain'
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
            }, 1000);
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

        // Fetch all the on-chain Balances for all of the tokens in the Token Registry
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

        const allOnChainTokenRegistryBalances = await Promise.all(allTokenRegistryBalancesAsync);

        const onChainTokenBalances = {};

        // Convert all of the Units into more Human Readable numbers
        // Many ERC20 tokens go to 18 decimal places
        _.each(allOnChainTokenRegistryBalances, (tokenBalance: TokenBalance) => {
            if (tokenBalance.balance && tokenBalance.balance.gt(0)) {
                tokenBalance.balance = ZeroEx.toUnitAmount(
                    tokenBalance.balance,
                    tokenBalance.token.decimals
                );
                onChainTokenBalances[tokenBalance.token.symbol] = tokenBalance;
            }
        });

        // Fetch all the off-chain Balances for all of the tokens in the Token Registry
        let offChainTokenBalances: OffChainTokenBalances;

        if (this.paymentNetworkRestClient) {
            offChainTokenBalances = await this.paymentNetworkRestClient.getBalances(address);
        } else {
            offChainTokenBalances = {
                userAddress: address,
                tokenBalances: new Map()
            };
        }
        
        const allOffChainTokenRegistryBalances: TokenBalance[] = _.map(tokens, (token: Token) => {
            const balance = offChainTokenBalances.tokenBalances.get(token.address);
            
            if (balance) {
                return { token: token, balance: balance };
            } else {
                return { token: token, balance: new BigNumber(0) };
            }
        });

        let offChainTokenBalanceDict = {};

        // Convert all of the Units into more Human Readable numbers
        // Many ERC20 tokens go to 18 decimal places
        _.each(allOffChainTokenRegistryBalances, (tokenBalance: TokenBalance) => {
            if (tokenBalance.balance && tokenBalance.balance.gt(0)) {
                tokenBalance.balance = ZeroEx.toUnitAmount(
                    tokenBalance.balance,
                    tokenBalance.token.decimals
                );
                offChainTokenBalanceDict[tokenBalance.token.symbol] = tokenBalance;
            }
        });

        // Fetch the Balance of Ether
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

        console.log(offChainTokenBalanceDict);

        await this.setState({
            onChainTokenBalances: onChainTokenBalances,
            offChainTokenBalances: offChainTokenBalanceDict,
            accounts: addresses,
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

    private onClickOnChainWorkflow = async (event: React.MouseEvent<HTMLButtonElement>, data: ButtonProps) => {
        await this.setState({ activeSettlementWorkflow: 'On-Chain' });
    }

    private onClickOffChainWorkflow = async (event: React.MouseEvent<HTMLButtonElement>, data: ButtonProps) => {
        await this.setState({ activeSettlementWorkflow: 'Off-Chain' });
    }

    private renderMakerWorkflow = (): any => {
        let makerStepToRender;
        let activeMakerStep = this.state.activeMakerStep;
        const zeroExMakerOrder = this.state.submitableZeroExMakerSignedOrder;
        const offChainMakerOrder = this.state.submitableOffChainMakerSignedOrder;
        const activeSettlementWorkflow = this.state.activeSettlementWorkflow;

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
                        setSubmitableZeroExSignedOrder={this.setSubmitableZeroExSignedOrder}
                        setSubmitableOffChainSignedOrder={this.setSubmitableOffChainSignedOrder}
                        activeSettlementWorkflow={this.state.activeSettlementWorkflow}
                    /> 
                );
                break;
            }
            // TODO: Figure out why this disappears after ive gone to a different step
            case 'SubmitOrder': {
                makerStepToRender = (
                    <SubmitSignedOrder
                        zeroExSignedOrder={this.state.submitableZeroExMakerSignedOrder}
                        offChainSignedOrder={this.state.submitableOffChainMakerSignedOrder}
                        activeSettlementWorkflow={this.state.activeSettlementWorkflow}
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
                style={{ 
                    padding: '1em 1em 1em 1em', 
                    marginTop: '0px !important', 
                    marginLeft: 'auto', 
                    marginRight: 'auto',
                    minWidth: '1000px'
                }}
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
                            isSubmitOrderDisabled={
                                (zeroExMakerOrder === undefined && activeSettlementWorkflow === 'On-Chain') 
                                ||
                                (offChainMakerOrder === undefined && activeSettlementWorkflow === 'Off-Chain')
                            }
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
                                onChainTokenBalances={this.state.onChainTokenBalances}
                                offChainTokenBalances={this.state.offChainTokenBalances}
                                etherBalance={this.state.etherBalance}
                                fetchAccountDetailsAsync={this.fetchAccountDetailsAsync}
                            />
                        </Card.Content>
                    </GridColumn>
                </Grid>
            </Card>
        );
    }

    private setSubmitableOffChainSignedOrder = async (signedOrder: OffChainSignedOrder) => {
        await this.setState({submitableOffChainMakerSignedOrder: signedOrder});
    }

    private setSubmitableZeroExSignedOrder = async (signedOrder: SignedOrder) => {
        await this.setState({submitableZeroExMakerSignedOrder: signedOrder});
    }

    private renderTakerWorkflow = (): any => {
        let takerStepToRender;
        let activeTakerStep = this.state.activeTakerStep;

        const wethTokenIndex = this.state.zeroExRegistryTokens.findIndex(x => x.symbol === 'WETH');

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
                takerStepToRender = this.state.activeSettlementWorkflow === 'On-Chain' ? (
                    <ZeroExTradeTokens 
                        zeroEx={this.zeroEx}
                        tokensWithAllowance={this.state.tokensWithAllowances} 
                        zeroExProxyTokens={this.state.zeroExRegistryTokens}
                        setTransactionMessageState={this.setTransactionMessageState}
                        accounts={this.state.accounts}
                    />
                ) : (
                    <OffChainTradeTokens
                        zeroEx={this.zeroEx}
                        tokensWithAllowance={this.state.tokensWithAllowances} 
                        zeroExProxyTokens={this.state.zeroExRegistryTokens}
                        setTransactionMessageState={this.setTransactionMessageState}
                        accounts={this.state.accounts}
                    />
                );
                break;
            }
            case 'WrapEth': {
                takerStepToRender = (
                    <WrapEth 
                        zeroEx={this.zeroEx}
                        setTransactionMessageState={this.setTransactionMessageState}
                        accounts={this.state.accounts}
                        wethToken={this.state.zeroExRegistryTokens[wethTokenIndex]}
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
                style={{ 
                    padding: '1em 1em 1em 1em', 
                    marginTop: '0px !important', 
                    marginLeft: 'auto', 
                    marginRight: 'auto',
                    minWidth: '1000px',
                }}
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
                                onChainTokenBalances={this.state.onChainTokenBalances}
                                offChainTokenBalances={this.state.offChainTokenBalances}
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
                <Container 
                    style={{ 
                        padding: '2em 1em 2em 1em', 
                        marginTop: '0px !important', 
                        marginLeft: 'auto', 
                        marginRight: 'auto',
                        marginBottom: 'auto',
                    }}
                >
                    <PaymentNetworkRestfulClient
                        ref={ref => (this.paymentNetworkRestClient = ref)} 
                    />
                    <Dashboard
                        activeWorkflow={this.state.activeUserWorkflow}
                        onChangeWorkflow={this.onChangeWorkflow}
                    />
                    <Grid 
                        centered={true} 
                        style={{ 
                            padding: '2em 1em 2em 1em', 
                            marginTop: '0px !important', 
                            marginLeft: 'auto', 
                            marginRight: 'auto',
                        }}
                    >
                        <Button.Group size="large">
                            <Button 
                                basic={this.state.activeSettlementWorkflow !== 'On-Chain'} 
                                onClick={this.onClickOnChainWorkflow}
                                color="grey" 
                                content="Blue"
                            >
                            On-Chain
                            </Button>
                            <Button 
                                basic={this.state.activeSettlementWorkflow !== 'Off-Chain'} 
                                onClick={this.onClickOffChainWorkflow}
                                color="grey" 
                                content="Black"
                            >
                            Off-Chain
                            </Button>
                        </Button.Group>
                    </Grid>
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
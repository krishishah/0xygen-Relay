import { ZeroEx, Token } from '0x.js';
import * as React from 'react';
import { BigNumber } from 'bignumber.js';
import { 
    Container, 
    Table, 
    Header, 
    Image, 
    Input, 
    Button, 
    ButtonProps,
    InputOnChangeData,
    TextArea,
    Statistic,
    Form,
    ButtonGroup,
    Segment,
    Divider,
    DropdownItemProps,
    DropdownProps
} from 'semantic-ui-react';
import { UserActionMessageStatus } from '../../../../../components/UserActionMessage';
import * as _ from 'lodash';
import { PaymentNetworkRestfulClient } from '../../../../../api/paymentNetwork/rest';

interface Props {
    zeroEx: ZeroEx;
    tokens: Token[];
    accounts: string[];
    setTransactionMessageState: (status: UserActionMessageStatus, message?: string) => void;
}

interface State {
    quantity: BigNumber;
    token: Token | undefined;
}

export default class DepositTokens extends React.Component<Props, State> {

    paymentNetworkRestClient: null | PaymentNetworkRestfulClient;

    constructor(props: Props) {
        super(props);
        this.state = {
            quantity: new BigNumber(0),
            token: undefined
        };
    }
    
    depositToken = async (event: React.MouseEvent<HTMLButtonElement>, data: ButtonProps) => {
        this.props.setTransactionMessageState('LOADING', 'Please wait, wrapping your ETH');

        if (!this.state.token) {
            this.props.setTransactionMessageState('FAILURE', 'Please select a token to deposit');
            return;
        }

        if (this.state.quantity.lessThanOrEqualTo(0)) {
            this.props.setTransactionMessageState('FAILURE', 'Please enter a valid token quantity');
            return;
        }

        // Number of tokens to deposit
        const tokenAmountToConvert = ZeroEx.toBaseUnitAmount(
            this.state.quantity,
            this.state.token.decimals
        );

        if (this.paymentNetworkRestClient) {
            try {
                const convertEthTxHash = await this.paymentNetworkRestClient.changeBalanceBy(
                    this.props.accounts[0],
                    this.state.token.address, 
                    tokenAmountToConvert, 
                );
                this.props.setTransactionMessageState(
                    'SUCCESS', 
                    `You have successfully deposited ${this.state.quantity} ${this.state.token.symbol} to escrow`
                );
            } catch (e) {
                this.props.setTransactionMessageState('FAILURE', e.message);
            }
        }
    }

    withdrawToken = async (event: React.MouseEvent<HTMLButtonElement>, data: ButtonProps) => {
        this.props.setTransactionMessageState('LOADING', 'Please wait, unwrapping your ETH');

        if (!this.state.token) {
            this.props.setTransactionMessageState('FAILURE', 'Please select a token to withdraw');
            return;
        }

        if (this.state.quantity.lessThanOrEqualTo(0)) {
            this.props.setTransactionMessageState('FAILURE', 'Please enter a valid token quantity');
            return;
        }

        // Number of tokens to withdraw
        const tokenAmountToConvert = ZeroEx.toBaseUnitAmount(
            this.state.quantity,
            this.state.token.decimals
        );

        if (this.paymentNetworkRestClient) {
            try {
                const convertEthTxHash = await this.paymentNetworkRestClient.changeBalanceBy(
                    this.props.accounts[0],
                    this.state.token.address, 
                    tokenAmountToConvert.negated(), 
                );
                this.props.setTransactionMessageState(
                    'SUCCESS', 
                    `You have successfully withdrawn ${this.state.quantity} ${this.state.token.symbol} from escrow`
                );
            } catch (e) {
                this.props.setTransactionMessageState('FAILURE', e.message);
            }
        }
    }

    onQuantityChange = (event: React.SyntheticEvent<HTMLInputElement>, data: InputOnChangeData) => {
        if (data.value) {
            try {
                this.setState({quantity: new BigNumber(data.value)});
            } catch(e) {
                console.log('Invalid Wrap Value: ' + e);
            }
        }
    }

    handleTokenDropDownItemSelected = async (e, data: DropdownProps) => {
        const itemProp = _.find(data.options, {value: data.value}) as DropdownItemProps;
        await this.setState({ token: itemProp.token });
    }

    render() {
        const tokens = this.props.tokens;

        const wrapEthIconDir = '/token_icons/wrapEth.png';
        const unwrapEthIconDir = '/token_icons/unwrapEth.png';

        const tokenDropDownItems: DropdownItemProps[] = _.map(tokens, (token: Token) => {
            return {
                key: token.symbol,
                value: token.symbol,  
                token: token, 
                text: `${token.symbol}: ${token.name}`,
            };
        });

        return (
            <Form style={{ height: '100%'}}>
                <PaymentNetworkRestfulClient
                    ref={ref => (this.paymentNetworkRestClient = ref)} 
                />
                <Header size="small" textAlign="center">
                    Off-Chain Token Allowances
                    <Header.Subheader>
                        Deposit your tokens in escrow to take advantage of off-chain settlement
                    </Header.Subheader>
                </Header>
                <Form.Dropdown 
                    required
                    selection 
                    label="Token" 
                    options={tokenDropDownItems}
                    onChange={this.handleTokenDropDownItemSelected}
                    placeholder="Token"
                />
                <Form.Input
                    label="Token Quantity"
                    required
                    onChange={this.onQuantityChange}
                />
                <div style={{margin: '1em', display: 'flex', justifyContent: 'center'}}>
                    <ButtonGroup>
                        <Button onClick={this.depositToken}>Deposit</Button>
                        <Button.Or />
                        <Button onClick={this.withdrawToken}>Withdraw</Button>
                    </ButtonGroup>
                </div>
            </Form>
        );
    }
}
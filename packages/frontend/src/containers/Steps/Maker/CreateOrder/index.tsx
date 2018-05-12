import * as React from 'react';
import { promisify } from '@0xproject/utils';
import { ZeroEx } from '0x.js/lib/src/0x';
import Faucet from '../../../../components/Faucet';
import { Token, OrderState, ECSignature } from '0x.js';
import { Dictionary } from 'lodash';
import { TokenAllowance } from '../../../App';
import * as _ from 'lodash';
import { RelayerWebSocketChannel } from '../../../../api/webSocket';
import Segment from 'semantic-ui-react/dist/commonjs/elements/Segment/Segment';
import { SerializerUtils } from '../../../../utils';
import { SignedOrder, Order } from '@0xproject/types';
import { BigNumber } from 'bignumber.js';
import * as Web3 from 'web3';
import { UserActionMessageStatus } from '../../../../components/UserActionMessage';
import { DatePicker, TimePicker } from 'antd';
import * as moment from 'moment';
import { 
    TokenPair, 
    WebSocketMessage, 
    OrderbookSnapshot, 
    OrderbookUpdate, 
    TokenPairOrderbook, 
    EnrichedSignedOrder,
    EnrichedTokenPairOrderbook
} from '../../../../types';
import { 
    DropdownProps, 
    DropdownItemProps, 
    ButtonProps, 
    Form, 
    Radio, 
    Grid,
    Statistic
} from 'semantic-ui-react';

import 'antd/dist/antd.css';
import { SimpleMakerTradeStep } from '../../../../components/SimpleMakerTradeSteps';

export type TradeAction = 'Buy' | 'Sell';

interface Props {
    zeroEx: ZeroEx;
    tokensWithAllowance: Dictionary<TokenAllowance>;
    zeroExProxyTokens: Token[];
    accounts: string[];
    setTransactionMessageState: (status: UserActionMessageStatus, message?: string) => void;
    progressMakerStep: (newStep: SimpleMakerTradeStep) => void;
    setSubmitableSignedOrder: (signedOrder: SignedOrder) => void;
}

interface State {
    tradeAction: TradeAction;
    baseTokenQuantity: BigNumber;
    quoteTokenQuantity: BigNumber;
    baseToken: Token | undefined;
    quoteToken: Token | undefined;
    date: moment.Moment;
    time: moment.Moment;
}

const GENESIS_ADDR: string = '0x0000000000000000000000000000000000000000';

export default class TradeTokens extends React.Component<Props, State> {
    
    constructor(props: Props) {
        super(props);

        this.state = {
            tradeAction: 'Buy',
            baseTokenQuantity: new BigNumber(0),
            quoteTokenQuantity: new BigNumber(0),
            baseToken: undefined,
            quoteToken: undefined,
            date: moment(),
            time: moment()
        };
    }

    fetchProxyTokenList = async () => {
        const tokens = await this.props.zeroEx.tokenRegistry.getTokensAsync();
    }

    handleBaseTokenDropDownItemSelected = async (e, data: DropdownProps) => {
        const itemProp = _.find(data.options, {value: data.value}) as DropdownItemProps;
        await this.setState({ baseToken: itemProp.token });
    }

    handleQuoteTokenDropDownItemSelected = async (e, data: DropdownProps) => {
        const itemProp = _.find(data.options, {value: data.value}) as DropdownItemProps;
        await this.setState({ quoteToken: itemProp.token });
    }

    handleBaseTokenQuantityChange = async (e, { value }) => {
        const previousState = Object.assign({}, this.state.baseTokenQuantity);
        if (value !== null) {
            try {
                await this.setState( { baseTokenQuantity: new BigNumber(value) } );
            } catch( e ) {
                console.log(e);
            }
        }
    }

    handleQuoteTokenQuantityChange = async (e, { value }) => {
        const previousState = Object.assign({}, this.state.quoteTokenQuantity);
        if (value !== null) {
            try {
                await this.setState( { quoteTokenQuantity: new BigNumber(value) } );
            } catch( e ) {
                console.log(e);
            }
        }
    }

    handleDateChange = (date: moment.Moment, dateString: string) => {
        this.setState({date});
    }

    handleTimeChange = (time: moment.Moment) => {
        this.setState({time});
    }

    handleTradeActionChange = async (e, { value }) => {
        await this.setState({ tradeAction: value });
    }

    onClickSign = async (event: React.MouseEvent<HTMLButtonElement>, data: ButtonProps) => {
        if (this.state.baseToken === undefined) {
            this.props.setTransactionMessageState('FAILURE', 'Please select a sell token from the drop down menu');
            return;
        } else if (this.state.quoteToken === undefined) {
            this.props.setTransactionMessageState('FAILURE', 'Please select a purchase token from the drop down menu');
            return;
        } else if (this.state.baseTokenQuantity.lessThanOrEqualTo(0)) {
            this.props.setTransactionMessageState('FAILURE', 'Please enter valid token quantities');
            return;
        } else if (this.state.quoteTokenQuantity.lessThanOrEqualTo(0)) {
            this.props.setTransactionMessageState('FAILURE', 'Please enter valid token quantities');
            return;
        }

        const baseToken = this.state.baseToken as Token;
        const quoteToken = this.state.quoteToken as Token;

        const quoteTokenQuantity = ZeroEx.toBaseUnitAmount(
            this.state.quoteTokenQuantity,
            quoteToken.decimals
        );

        const baseTokenQuantity = ZeroEx.toBaseUnitAmount(
            this.state.baseTokenQuantity,
            baseToken.decimals
        );

        const expirationUnixTimestampSec = moment(
            this.state.date.format('YYYY-MM-DD') + ' ' + this.state.time.format('HH:mm:ss'), 'YYYY-MM-DD HH:mm:ss'
        ).valueOf();

        if (expirationUnixTimestampSec <= moment().valueOf() || expirationUnixTimestampSec === NaN) {
            this.props.setTransactionMessageState('FAILURE', 'Please enter valid order expiration date and time');
            return;
        }

        let order: Order = {
            maker: this.props.accounts[0],
            taker: GENESIS_ADDR,
            makerFee: new BigNumber(0),
            takerFee: new BigNumber(0),
            makerTokenAmount: quoteTokenQuantity,
            takerTokenAmount: baseTokenQuantity,
            makerTokenAddress: quoteToken.address,
            takerTokenAddress: baseToken.address,
            salt: ZeroEx.generatePseudoRandomSalt(),
            exchangeContractAddress: this.props.zeroEx.exchange.getContractAddress(),
            feeRecipient: GENESIS_ADDR,
            expirationUnixTimestampSec: new BigNumber(expirationUnixTimestampSec)
        };

        const orderHash = ZeroEx.getOrderHashHex(order);

        const signature: ECSignature = await this.props.zeroEx.signOrderHashAsync(
            orderHash, 
            this.props.accounts[0],
            true
        );

        const signedOrder: SignedOrder = {
            ecSignature: signature,
            ...order
        };

        await this.props.setSubmitableSignedOrder(signedOrder);

        await this.props.progressMakerStep('SubmitOrder');
    }

    render() {
        const zeroExProxyTokens: Token[] = this.props.zeroExProxyTokens;
        const tokensWithAllowance: Dictionary<TokenAllowance> = this.props.tokensWithAllowance;
        const baseToken = this.state.baseToken;
        const quoteToken = this.state.quoteToken;
        const tradeAction = this.state.tradeAction;

        const tokenDropDownItems: DropdownItemProps[] = _.chain(zeroExProxyTokens)
            .filter((token: Token) => tokensWithAllowance[token.symbol])
            .map((token: Token) => {
                return {
                    key: token.symbol,
                    value: token.symbol, 
                    token: token, 
                    text: `${token.symbol}: ${token.name}`,
                };
            })
            .value();

        return (
            <Form style={{ height: '100%' }}>
                <Form.Dropdown 
                    required
                    selection 
                    label="Purchase Token" 
                    options={tokenDropDownItems}
                    onChange={this.handleBaseTokenDropDownItemSelected}
                    placeholder="Token"
                />
                <Form.Input 
                    required
                    labelPosition="left"
                    label="Purchase Token Quantity" 
                    placeholder="Amount"
                    onChange={this.handleBaseTokenQuantityChange} 
                />
                <Form.Dropdown 
                    required
                    selection
                    label="Sell Token" 
                    options={tokenDropDownItems} 
                    onChange={this.handleQuoteTokenDropDownItemSelected}
                    placeholder="Token"
                />
                <Form.Input 
                    required
                    labelPosition="left"
                    label="Sell Token Quantity"
                    placeholder="Amount" 
                    onChange={this.handleQuoteTokenQuantityChange} 
                />
                <Form.Field required>
                    <label>Order Expiration</label>
                    <Form.Group widths="equal">
                        <Form.Field>
                            <DatePicker
                                style={{ width: '100%' }} 
                                onChange={this.handleDateChange} 
                                size="large"
                            />
                        </Form.Field>
                        <Form.Field>
                            <TimePicker
                                style={{ width: '100%' }} 
                                onChange={this.handleTimeChange} 
                                defaultOpenValue={moment('00:00:00', 'HH:mm:ss')} 
                                size="large"
                            />
                        </Form.Field>
                    </Form.Group>
                </Form.Field>
                <div style={{margin: '1em', display: 'flex', justifyContent: 'center'}}>
                    <Form.Button onClick={this.onClickSign}>
                        Sign Order
                    </Form.Button>
                </div>
            </Form>
        );
    }
}

import * as React from 'react';
import { promisify } from '@0xproject/utils';
import { ZeroEx } from '0x.js/lib/src/0x';
import Faucet from '../../../components/Faucet';
import { Token } from '0x.js';
import { Dictionary } from 'lodash';
import { TokenAllowance } from '../../App';
import * as _ from 'lodash';
import { RelayerWebSocketChannel } from '../../../api/webSocket';
import Segment from 'semantic-ui-react/dist/commonjs/elements/Segment/Segment';
import { 
    TokenPair, 
    WebSocketMessage, 
    OrderbookSnapshot, 
    OrderbookUpdate, 
    TokenPairOrderbook 
} from '../../../types';
import { 
    DropdownProps, 
    Dropdown, 
    Button, 
    Container, 
    Form, 
    Radio, 
    TextArea, 
    Checkbox, 
    Input, 
    DropdownItemProps, 
    Grid, 
    Statistic, 
    Icon, 
    Divider, 
    Label
} from 'semantic-ui-react';
import { SerializerUtils } from '../../../utils';
import { SignedOrder } from '@0xproject/types';
import { BigNumber } from 'bignumber.js';
import * as Web3 from 'web3';

export type TradeAction = 'Buy' | 'Sell';

interface Props {
    zeroEx: ZeroEx;
    tokensWithAllowance: Dictionary<TokenAllowance>;
    zeroExProxyTokens: Token[];
    web3: Web3;
}

interface State {
    tradeAction: TradeAction;
    tokenQuantity: BigNumber;
    baseToken: Token | undefined;
    quoteToken: Token | undefined;
    orderbook: TokenPairOrderbook | undefined;
    lowerBoundExchangeRate: BigNumber;
    upperBoundExchangeRate: BigNumber;
}

export default class TradeTokens extends React.Component<Props, State> {

    relayerWsChannel: RelayerWebSocketChannel | null;
    ordersToFill: SignedOrder[];
    
    constructor(props: Props) {
        super(props);

        this.state = {
            tradeAction: 'Buy',
            tokenQuantity: new BigNumber(0),
            baseToken: undefined,
            quoteToken: undefined,
            orderbook: undefined,
            lowerBoundExchangeRate: new BigNumber(0),
            upperBoundExchangeRate: new BigNumber(0),
        };
    }

    componentWillUnmount() {
        if (this.relayerWsChannel) {
            this.relayerWsChannel.closeConnection();
        }
    }

    fetchProxyTokenList = async () => {
        const tokens = await this.props.zeroEx.tokenRegistry.getTokensAsync();
    }

    handleTradeActionChange = async (e, { value }) => {
        await this.setState({ tradeAction: value });
        this.onPropertyChanged();
    }

    handleTokenQuantityChange = async (e, { value }) => {
        if (value !== null) {
            try {
                await this.setState({ tokenQuantity: new BigNumber(value) });
                this.onPropertyChanged();
            } catch( e ) {
                console.log(e);
            }
        }
    }

    handleBaseTokenDropDownItemSelected = async (e, data: DropdownProps) => {
        const itemProp = _.find(data.options, {value: data.value}) as DropdownItemProps;
        await this.setState({ baseToken: itemProp.token });
        this.onPropertyChanged();
    }

    handleQuoteTokenDropDownItemSelected = async (e, data: DropdownProps) => {
        const itemProp = _.find(data.options, {value: data.value}) as DropdownItemProps;
        await this.setState({ quoteToken: itemProp.token });
        this.onPropertyChanged();
    }

    onPropertyChanged = async () => {
        let baseToken = this.state.baseToken;
        let quoteToken = this.state.quoteToken;
        let tradeAction = this.state.tradeAction;
        
        if (baseToken && quoteToken && this.state.tokenQuantity.greaterThan(0)) {
            baseToken = baseToken as Token;
            quoteToken = quoteToken as Token;

            let tokenPair: TokenPair = tradeAction === 'Buy' ? 
            {
                base: baseToken,
                quote: quoteToken
            } : {
                base: quoteToken,
                quote: baseToken
            };

            if (this.relayerWsChannel) {
                await this.relayerWsChannel.initialiseConnection();
                await this.relayerWsChannel.subscribe(tokenPair);
            } 
        } else {
            this.ordersToFill = [];
        }
    }

    onSnapshot = async (snapshot: WebSocketMessage<OrderbookSnapshot>, tokenPair: TokenPair) => {
        const tokenPairOrderbook = SerializerUtils.TokenPairOrderbookFromJSON(snapshot.payload);
        
        // Log number of bids and asks currently in the orderbook
        const numberOfBids = tokenPairOrderbook.bids.length;
        const numberOfAsks = tokenPairOrderbook.asks.length;
        console.log(`SNAPSHOT: ${numberOfBids} bids & ${numberOfAsks} asks`);

        // Sort bids and asks in order of best rates
        tokenPairOrderbook.bids.sort(this.sortBids);
        tokenPairOrderbook.asks.sort(this.sortAsks);

        // onSnapshot is only called once both base and quote tokens have been chosen
        const baseToken = this.state.baseToken as Token;
        const quoteToken = this.state.quoteToken as Token;

        tokenPairOrderbook.asks.map(order => {
            order.makerTokenAmount = ZeroEx.toUnitAmount(
                new BigNumber(order.makerTokenAmount),
                baseToken.decimals
            );

            order.takerTokenAmount = ZeroEx.toUnitAmount(
                new BigNumber(order.takerTokenAmount),
                quoteToken.decimals
            );
        });

        await this.setState({
            orderbook: tokenPairOrderbook
        });

        await this.calculateRateRange();
    }

    sortBids = (a: SignedOrder, b: SignedOrder) => {
        const orderRateA = a.makerTokenAmount.dividedBy(a.takerTokenAmount);
        const orderRateB = b.makerTokenAmount.dividedBy(b.takerTokenAmount);
        return orderRateB.comparedTo(orderRateA);
    }

    sortAsks = (a: SignedOrder, b: SignedOrder) => {
        const orderRateA = a.makerTokenAmount.dividedBy(a.takerTokenAmount);
        const orderRateB = b.makerTokenAmount.dividedBy(b.takerTokenAmount);
        return orderRateA.comparedTo(orderRateB);
    }

    onUpdate = async (update: WebSocketMessage<OrderbookUpdate>, tokenPair: TokenPair) => {
        const zeroEx = this.props.zeroEx;
        const orderbook = Object.assign({}, this.state.orderbook) as TokenPairOrderbook;
        const order: SignedOrder = SerializerUtils.SignedOrderfromJSON(update.payload);
        
        // Log order hash
        const orderHash = ZeroEx.getOrderHashHex(order);
        console.log(`NEW ORDER: ${orderHash}`);

        // Ask - Taker buys base token, Maker buys quote token
        if (order.makerTokenAddress === tokenPair.base.address) {
            // TODO: Find more efficient method of adding new asks in sorted fashion
            orderbook.asks.push(order);
            orderbook.asks.sort(this.sortAsks);
        }

        // Bids - Maker buys base token, Taker buys quote token
        if (order.makerTokenAddress === tokenPair.quote.address) {
            // TODO: Find more efficient method of adding new bids in sorted fashion
            orderbook.bids.push(order);
            orderbook.bids.sort(this.sortAsks);
        }
        
        this.setState({
            orderbook: orderbook
        });
    }

    calculateRateRange = async () => {
        const baseToken = this.state.baseToken;
        const quoteToken = this.state.quoteToken;
        const tradeAction = this.state.tradeAction;
        const tokenQuantity = this.state.tokenQuantity;
        const orderbook = this.state.orderbook;

        let minExchangeRate;
        let maxExchangeRate;

        // (Ask, Buy) - Taker buys base token, Maker sells base token
        if (tradeAction === 'Buy' && orderbook !== undefined) {
            const asks: SignedOrder[] = orderbook.asks;

            let lowerBoundBaseTokenQuantity: BigNumber = new BigNumber(0);
            let lowerBoundQuoteTokenQuantity: BigNumber = new BigNumber(0);

            let upperBoundBaseTokenQuantity: BigNumber = new BigNumber(0);
            let upperBoundQuoteTokenQuantity: BigNumber = new BigNumber(0);

            // TODO: Save to state
            this.ordersToFill = [];

            // Calculate Lower Bound
            let i;
            for (i = 0; i < asks.length; i++) {
                const order: SignedOrder = asks[i];
                if (lowerBoundBaseTokenQuantity.lessThan(tokenQuantity)) {
                    console.log(`lower bound signed order: ${JSON.stringify(order)}`);
                    let baseTokenQuantityToFill = tokenQuantity.minus(lowerBoundBaseTokenQuantity);
                    let orderRate = order.takerTokenAmount.div(order.makerTokenAmount);
                    
                    baseTokenQuantityToFill = baseTokenQuantityToFill.lessThan(order.makerTokenAmount)
                    ? lowerBoundBaseTokenQuantity.add(baseTokenQuantityToFill)
                    : lowerBoundBaseTokenQuantity.add(order.makerTokenAmount);

                    lowerBoundBaseTokenQuantity = lowerBoundBaseTokenQuantity.add(baseTokenQuantityToFill)

                    let quoteTokenQuantityToFill = orderRate.mul(baseTokenQuantityToFill);
                    lowerBoundQuoteTokenQuantity = lowerBoundQuoteTokenQuantity.add(quoteTokenQuantityToFill);
                    this.ordersToFill.push(order);
                } else {
                    break;
                }
            }

            // Calculate conservative threadshold for upper bound estimate. Currently 2x
            i = (i * 2) >= asks.length ? asks.length - 1 : (i * 2) ;

            // Calculate Upper Bound
            for (i; i >= 0; i--) {
                const order: SignedOrder = asks[i];
                if ((upperBoundBaseTokenQuantity.lessThan(tokenQuantity))) {
                    console.log(`upper bound signed order: ${JSON.stringify(order)}`);
                    let baseTokenQuantityToFill = tokenQuantity.minus(upperBoundBaseTokenQuantity);
                    let orderRate = order.takerTokenAmount.div(order.makerTokenAmount);
                    
                    baseTokenQuantityToFill = baseTokenQuantityToFill.lessThan(order.makerTokenAmount)
                    ? upperBoundBaseTokenQuantity.add(baseTokenQuantityToFill)
                    : upperBoundBaseTokenQuantity.add(order.makerTokenAmount);

                    upperBoundBaseTokenQuantity = upperBoundBaseTokenQuantity.add(baseTokenQuantityToFill)

                    let quoteTokenQuantityToFill = orderRate.mul(baseTokenQuantityToFill);
                    upperBoundQuoteTokenQuantity = upperBoundQuoteTokenQuantity.add(quoteTokenQuantityToFill);
                    this.ordersToFill.push(order);
                }
            }

            await this.setState({
                lowerBoundExchangeRate: lowerBoundQuoteTokenQuantity.div(lowerBoundBaseTokenQuantity),
                upperBoundExchangeRate: upperBoundQuoteTokenQuantity.div(upperBoundBaseTokenQuantity)
            });
        }
    }

    executeTrade = async () => {
        const fillQuantity = this.state.tokenQuantity;
        const takerAddress = this.props.web3.eth.accounts[0];
        if (this.ordersToFill.length > 0) {
            this.props.zeroEx.exchange.fillOrdersUpToAsync(this.ordersToFill, fillQuantity, false, takerAddress); 
        }
    }

    render() {
        const zeroExProxyTokens: Token[] = this.props.zeroExProxyTokens;
        const tokensWithAllowance: Dictionary<TokenAllowance> = this.props.tokensWithAllowance;
        const baseToken = this.state.baseToken;
        const quoteToken = this.state.quoteToken;
        const tradeAction = this.state.tradeAction;
        const lowerBoundExchangeRate = this.state.lowerBoundExchangeRate.toPrecision(4).toString();
        const upperBoundExchangeRate = this.state.upperBoundExchangeRate.toPrecision(4).toString();
        const lowerBoundTokenQuantity =  this.state.tokenQuantity.div(lowerBoundExchangeRate).toPrecision(4).toString();
        const upperBoundTokenQuantity =  this.state.tokenQuantity.div(upperBoundExchangeRate).toPrecision(4).toString();

        const baseTokenDropDownItems: DropdownItemProps[] = _.chain(zeroExProxyTokens)
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

        const quoteTokenDropDownItems: DropdownItemProps[] = _.map(zeroExProxyTokens, (token: Token) => {
            return {
                key: token.symbol,
                value: token.symbol,  
                token: token, 
                text: `${token.symbol}: ${token.name}`,
            };
        });

        let tokenStatistics;

        if (baseToken && quoteToken && this.state.tokenQuantity) {
            const b = baseToken as Token;
            const q = quoteToken as Token;
            tokenStatistics = (
                <Segment>
                    <Grid rows={3} textAlign="center" style={{margin: '1em 1em 1em 1em'}}>
                        <Grid.Row>
                            <Statistic size='small'>
                                <Statistic.Value>{lowerBoundTokenQuantity} - {upperBoundTokenQuantity}</Statistic.Value>
                                <Statistic.Label>{q.symbol}</Statistic.Label>
                            </Statistic>
                        </Grid.Row>
                        <Grid.Row><h3>AT</h3></Grid.Row>
                        <Grid.Row>
                            <Statistic size='small'>
                                <Statistic.Value>{lowerBoundExchangeRate} - {upperBoundExchangeRate}</Statistic.Value>
                                <Statistic.Label>{b.symbol}/{q.symbol}</Statistic.Label>
                            </Statistic>
                        </Grid.Row>
                    </Grid>
                </Segment>
            );
        } else {
            tokenStatistics = ( 
                <Segment textAlign="center">
                    <Statistic size='small'>
                        <Statistic.Value>0</Statistic.Value>
                        <Statistic.Label>{quoteToken ? quoteToken.symbol : 'WETH'}</Statistic.Label>
                    </Statistic>
                </Segment>
            );
        }

        return (
            <Form style={{ height: '100%' }}>
                <RelayerWebSocketChannel
                    ref={ref => (this.relayerWsChannel = ref)} 
                    onSnapshot={this.onSnapshot}
                    onUpdate={this.onUpdate}
                />
                <Form.Group inline style={{display: 'flex', justifyContent: 'center'}}>
                    <label>I would like to:</label>
                    <Form.Radio
                        control={Radio} 
                        label="Buy" 
                        value="Buy" 
                        checked={this.state.tradeAction === 'Buy'} 
                        onChange={this.handleTradeActionChange} 
                    />
                    <Form.Radio 
                        label="Sell" 
                        value="Sell" 
                        checked={this.state.tradeAction === 'Sell'} 
                        onChange={this.handleTradeActionChange} 
                    />
                </Form.Group>
                <Form.Input 
                    required
                    labelPosition="left"
                    label="Token Quantity" 
                    placeholder="Amount" 
                    onChange={this.handleTokenQuantityChange}
                />
                <Form.Dropdown 
                    required
                    selection 
                    label="Token" 
                    options={baseTokenDropDownItems}
                    onChange={this.handleBaseTokenDropDownItemSelected}
                    placeholder="Token"
                />
                <Form.Dropdown 
                    required
                    selection
                    label="In exchange for:" 
                    options={quoteTokenDropDownItems} 
                    onChange={this.handleQuoteTokenDropDownItemSelected}
                    placeholder="Token"
                />
                <h5>You Will {tradeAction === 'Buy' ? 'Spend' : 'Purchase'}:</h5>
                {tokenStatistics}
                <div style={{margin: '1em', display: 'flex', justifyContent: 'center'}}>
                    <Form.Field 
                        required 
                        control={Checkbox} 
                        label="I agree to the Terms and Conditions"   
                    />
                </div>
                <div style={{margin: '1em', display: 'flex', justifyContent: 'center'}}>
                    <Form.Button>
                        Trade
                    </Form.Button>
                </div>
            </Form>
        );
    }
}

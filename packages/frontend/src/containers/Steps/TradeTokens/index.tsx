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
import { TokenPair, WebSocketMessage, OrderbookSnapshot, OrderbookUpdate, TokenPairOrderbook } from '../../../types';
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

export type TradeAction = 'Buy' | 'Sell';

interface Props {
    zeroEx: ZeroEx;
    tokensWithAllowance: Dictionary<TokenAllowance>;
    zeroExProxyTokens: Token[];
}

interface State {
    tradeAction: TradeAction;
    tokenQuantity: number;
    baseToken: Token | undefined;
    quoteToken: Token | undefined;
    orderbook: TokenPairOrderbook | undefined;
}

export default class TradeTokens extends React.Component<Props, State> {

    relayerWsChannel: RelayerWebSocketChannel | null;
    
    constructor(props: Props) {
        super(props);

        this.state = {
            tradeAction: 'Buy',
            tokenQuantity: 0,
            baseToken: undefined,
            quoteToken: undefined,
            orderbook: undefined
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
        await this.setState({ tokenQuantity: value });
        this.onPropertyChanged();
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

        if (baseToken && quoteToken && this.state.tokenQuantity) {
            baseToken = baseToken as Token;
            quoteToken = quoteToken as Token;

            const tokenPair: TokenPair = {
                base: baseToken,
                quote: quoteToken
            };

            if (this.relayerWsChannel) {
                await this.relayerWsChannel.initialiseConnection();
                await this.relayerWsChannel.subscribe(tokenPair);
            } 
        }
    }

    onSnapshot = (snapshot: WebSocketMessage<OrderbookSnapshot>, tokenPair: TokenPair) => {
        const tokenPairOrderbook = SerializerUtils.TokenPairOrderbookFromJSON(snapshot.payload);
        // Log number of bids and asks currently in the orderbook
        const numberOfBids = tokenPairOrderbook.bids.length;
        const numberOfAsks = tokenPairOrderbook.asks.length;
        console.log(`SNAPSHOT: ${numberOfBids} bids & ${numberOfAsks} asks`);

        this.setState({
            orderbook: tokenPairOrderbook
        });
     }

    onUpdate = async (update: WebSocketMessage<OrderbookUpdate>, tokenPair: TokenPair) => {
        const zeroEx = this.props.zeroEx;
        
        const order: SignedOrder = SerializerUtils.SignedOrderfromJSON(update.payload);
        
        // Log order hash
        const orderHash = ZeroEx.getOrderHashHex(order);
        console.log(`NEW ORDER: ${orderHash}`);

        // Look for asks
        if (order.makerTokenAddress === tokenPair.base.address) {
            // Calculate the rate of the new order
            const zrxWethRate = order.makerTokenAmount.div(order.takerTokenAmount);
            // If the rate is equal to our better than the rate we are looking for, try and fill it
            const TARGET_RATE = 6; // ZRX/WETH
            if (zrxWethRate.greaterThanOrEqualTo(TARGET_RATE)) {
                const addresses = await zeroEx.getAvailableAddressesAsync();
                // This can be any available address of you're choosing, in this example addresses[0] is actually
                // creating and signing the new orders we're receiving so we need to fill the order with
                // a different address
                const takerAddress = addresses[1];
                const txHash = await zeroEx.exchange.fillOrderAsync(
                    order, order.takerTokenAmount, true, takerAddress);
                await zeroEx.awaitTransactionMinedAsync(txHash);
                console.log(`ORDER FILLED: ${orderHash}`);
            }
        }
    }

    render() {
        const zeroExProxyTokens: Token[] = this.props.zeroExProxyTokens;
        const tokensWithAllowance: Dictionary<TokenAllowance> = this.props.tokensWithAllowance;
        const baseToken = this.state.baseToken;
        const quoteToken = this.state.quoteToken;
        const tradeAction = this.state.tradeAction;

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
                                <Statistic.Value>54~57</Statistic.Value>
                                <Statistic.Label>{q.symbol}</Statistic.Label>
                            </Statistic>
                        </Grid.Row>
                        <Grid.Row><h3>AT</h3></Grid.Row>
                        <Grid.Row>
                            <Statistic size='small'>
                                <Statistic.Value>3.42156~4.5631</Statistic.Value>
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

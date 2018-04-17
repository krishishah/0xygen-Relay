import * as React from 'react';
import { promisify } from '@0xproject/utils';
import { ZeroEx } from '0x.js/lib/src/0x';
import Faucet from '../../../components/Faucet';
import { Token } from '0x.js';
import { Dictionary } from 'lodash';
import { TokenAllowance } from '../../App';
import * as _ from 'lodash';
import { RelayerWebSocketClient } from '../../../api/webSocket/relayerWebSocketClient';
import { RelayerWebSocketChannel } from '../../../api/webSocket/relayerWebSocketChannel';
import Segment from 'semantic-ui-react/dist/commonjs/elements/Segment/Segment';
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
import { TokenPair, WebSocketMessage, OrderbookSnapshot, OrderbookUpdate } from '../../../types';

export type TradeAction = 'Buy' | 'Sell';

interface Props {
    zeroEx: ZeroEx;
    tokensWithAllowance: Dictionary<TokenAllowance>;
    zeroExProxyTokens: Token[];
    relayerWebSocketClient: RelayerWebSocketClient;
}

interface State {
    tradeAction: TradeAction;
    tokenQuantity: number;
    baseToken: Token | undefined;
    quoteToken: Token | undefined;
}

export default class TradeTokens extends React.Component<Props, State> {

    relayerWsChannel: RelayerWebSocketChannel | null;
    
    constructor(props: Props) {
        super(props);

        this.state = {
            tradeAction: 'Buy',
            tokenQuantity: 0,
            baseToken: undefined,
            quoteToken: undefined
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
        const relayerWebSocketClient = this.props.relayerWebSocketClient;
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

    onSubscribe = (snapshot: WebSocketMessage<OrderbookSnapshot>) => { }

    onUpdate = (update: WebSocketMessage<OrderbookUpdate>) => { }

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
                    onSnapshot={this.onSubscribe}
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

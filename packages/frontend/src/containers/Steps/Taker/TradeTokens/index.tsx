import * as React from 'react';
import { promisify } from '@0xproject/utils';
import { ZeroEx } from '0x.js/lib/src/0x';
import Faucet from '../../../../components/Faucet';
import { Token, OrderState } from '0x.js';
import { Dictionary } from 'lodash';
import { TokenAllowance } from '../../../App';
import * as _ from 'lodash';
import { RelayerWebSocketChannel } from '../../../../api/webSocket';
import Segment from 'semantic-ui-react/dist/commonjs/elements/Segment/Segment';
import { SerializerUtils } from '../../../../utils';
import { SignedOrder } from '@0xproject/types';
import { BigNumber } from 'bignumber.js';
import * as Web3 from 'web3';
import { UserActionMessageStatus } from '../../../../components/UserActionMessage';
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
    Label,
    ButtonProps
} from 'semantic-ui-react';

export type TradeAction = 'Buy' | 'Sell';

interface Props {
    zeroEx: ZeroEx;
    tokensWithAllowance: Dictionary<TokenAllowance>;
    zeroExProxyTokens: Token[];
    accounts: string[];
    setTransactionMessageState: (status: UserActionMessageStatus, message?: string) => void;
}

interface State {
    tradeAction: TradeAction;
    tokenQuantity: BigNumber;
    baseToken: Token | undefined;
    quoteToken: Token | undefined;
    enrichedOrderbook: EnrichedTokenPairOrderbook | undefined;
    lowerBoundExchangeRate: BigNumber;
    upperBoundExchangeRate: BigNumber;
}

export default class TradeTokens extends React.Component<Props, State> {

    relayerWsChannel: RelayerWebSocketChannel | null;

    // Sets maintain insertion order
    ordersToFill: Map<string, SignedOrder>;
    
    constructor(props: Props) {
        super(props);

        this.state = {
            tradeAction: 'Buy',
            tokenQuantity: new BigNumber(0),
            baseToken: undefined,
            quoteToken: undefined,
            enrichedOrderbook: undefined,
            lowerBoundExchangeRate: new BigNumber(0),
            upperBoundExchangeRate: new BigNumber(0),
        };
    }

    componentWillUnmount() {
        if (this.relayerWsChannel) {
            this.relayerWsChannel.closeConnection();
        }
        try {
            this.props.zeroEx.orderStateWatcher.unsubscribe();
        } catch (e) {
            console.log('TradeTokens componentWillUnmount error: ', e.message);
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
        const previousState = Object.assign({}, this.state.tokenQuantity);
        if (value !== null) {
            try {
                await this.setState( { tokenQuantity: new BigNumber(value) } );
                if (!previousState) {
                    this.onPropertyChanged();
                } else {
                    this.calculateRateRange();
                }
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
            this.ordersToFill = new Map();
        }
    }

    onRelayerSnapshot = async (snapshot: WebSocketMessage<OrderbookSnapshot>, tokenPair: TokenPair) => {
        const tokenPairOrderbook = SerializerUtils.TokenPairOrderbookFromJSON(snapshot.payload);
        
        // Log number of bids and asks currently in the orderbook
        const numberOfBids = tokenPairOrderbook.bids.length;
        const numberOfAsks = tokenPairOrderbook.asks.length;
        console.log(`SNAPSHOT: ${numberOfBids} bids & ${numberOfAsks} asks`);

        // Enrich
        const enrichedOrderbook = this.validateAndEnrichOrderbook(tokenPairOrderbook);

        // Sort bids and asks in order of best rates
        enrichedOrderbook.bids.sort(this.sortEnrichedAsks);
        enrichedOrderbook.asks.sort(this.sortEnrichedAsks);

        await this.setState({ enrichedOrderbook });

        await this.calculateRateRange();

    }

    sortEnrichedBids = (a: EnrichedSignedOrder, b: EnrichedSignedOrder) => {
        const orderRateA = a.remainingMakerTokenAmount.dividedBy(a.remainingTakerTokenAmount);
        const orderRateB = b.remainingMakerTokenAmount.dividedBy(b.remainingTakerTokenAmount);
        return orderRateB.comparedTo(orderRateA);
    }

    sortEnrichedAsks = (a: EnrichedSignedOrder, b: EnrichedSignedOrder) => {
        const orderRateA = a.remainingMakerTokenAmount.dividedBy(a.remainingTakerTokenAmount);
        const orderRateB = b.remainingMakerTokenAmount.dividedBy(b.remainingTakerTokenAmount);
        return orderRateA.comparedTo(orderRateB);
    }

    onRelayerUpdate = async (update: WebSocketMessage<OrderbookUpdate>, tokenPair: TokenPair) => {
        const zeroEx = this.props.zeroEx;
        const enrichedOrderbook = Object.assign({}, this.state.enrichedOrderbook) as EnrichedTokenPairOrderbook;
        const order: SignedOrder = SerializerUtils.SignedOrderfromJSON(update.payload);
        
        // Log order hash
        const orderHash = ZeroEx.getOrderHashHex(order);
        console.log(`NEW ORDER: ${orderHash}`);
        console.log('ask array length', JSON.stringify(this.state.enrichedOrderbook));

        // Return if order already exists in orderbook
        for (let x = 0; x < enrichedOrderbook.asks.length; x++) {
            if (ZeroEx.getOrderHashHex(enrichedOrderbook.asks[x].signedOrder) === ZeroEx.getOrderHashHex(order)) {
                console.log('REPEAT ASK IGNORING');
                return;
            }
        }

        for (let x = 0; x < enrichedOrderbook.bids.length; x++) {
            if (ZeroEx.getOrderHashHex(enrichedOrderbook.bids[x].signedOrder) === ZeroEx.getOrderHashHex(order)) {
                console.log('REPEAT BID IGNORING');
                return;
            }
        }

        // Enrich Order
        this.validateAndEnrichSignedOrder(order)
            .then((enrichedOrder: EnrichedSignedOrder) => {    
                // Ask - Taker buys base token, Maker buys quote token
                if (order.makerTokenAddress === tokenPair.base.address) {
                    // TODO: Find more efficient method of adding new asks in sorted fashion
                    enrichedOrderbook.asks.push(enrichedOrder);
                    enrichedOrderbook.asks.sort(this.sortEnrichedAsks);
                }

                // Bids - Maker buys base token, Taker buys quote token
                if (order.makerTokenAddress === tokenPair.quote.address) {
                    // TODO: Find more efficient method of adding new bids in sorted fashion
                    enrichedOrderbook.bids.push(enrichedOrder);
                    enrichedOrderbook.bids.sort(this.sortEnrichedBids);
                }
                
                this.setState({
                    enrichedOrderbook
                });

                return this.calculateRateRange();
            })
            .catch(err => {
                console.log(`Invalid Signed Order Update ${JSON.stringify(order)} with Error: ${err.message}`)
            }
        );
    }

    validateAndEnrichOrderbook(orderbook: TokenPairOrderbook): EnrichedTokenPairOrderbook {
        let enrichedBids: EnrichedSignedOrder[] = [];
        let enrichedAsks: EnrichedSignedOrder[] = [];

        orderbook.bids.map(order => {
            this.validateAndEnrichSignedOrder(order)
                .then(enrichedOrder => enrichedBids.push(enrichedOrder))
                .catch(e => console.log(`Invalid Order Error ${e.message}`));
        });

        orderbook.asks.map(order => {
            this.validateAndEnrichSignedOrder(order)
                .then(enrichedOrder => enrichedAsks.push(enrichedOrder))
                .catch(e => console.log(`Invalid Order Error ${e.message}`));
        });

        const enrichedTokenPairOrderbook: EnrichedTokenPairOrderbook = {
            bids: enrichedBids,
            asks: enrichedAsks
        };
        return enrichedTokenPairOrderbook;
    }

    validateAndEnrichSignedOrder(signedOrder: SignedOrder): Promise<EnrichedSignedOrder> {
        const zeroEx = this.props.zeroEx;

        let orderHashHex: string = ZeroEx.getOrderHashHex(signedOrder);
        
        const enrichedOrder: EnrichedSignedOrder = {
            signedOrder: signedOrder,
            remainingMakerTokenAmount: signedOrder.makerTokenAmount,
            remainingTakerTokenAmount: signedOrder.takerTokenAmount
        };

        let remainingFillableTakerAmount = new BigNumber(0);

        return zeroEx
            .exchange
            .getCancelledTakerAmountAsync(orderHashHex)
            .then((cancelledTakerAmount: BigNumber) => {
                remainingFillableTakerAmount = remainingFillableTakerAmount.add(cancelledTakerAmount);
                return zeroEx.exchange.getFilledTakerAmountAsync(orderHashHex);
            })
            .then((filledTakerAmount: BigNumber) => {
                remainingFillableTakerAmount = remainingFillableTakerAmount.add(filledTakerAmount);
                
                if (!remainingFillableTakerAmount.lessThan(signedOrder.takerTokenAmount)) {
                    throw (
                        `Unfillable Order Error! Order has no fillable tokens remaining:\n
                        ${JSON.stringify(signedOrder)}`
                    );
                }

                const rate = enrichedOrder.signedOrder.makerTokenAmount.div(
                    enrichedOrder.signedOrder.takerTokenAmount
                );
                
                enrichedOrder.remainingTakerTokenAmount = enrichedOrder.remainingTakerTokenAmount.minus(
                    remainingFillableTakerAmount
                );

                enrichedOrder.remainingMakerTokenAmount = enrichedOrder.remainingMakerTokenAmount.minus(
                    remainingFillableTakerAmount.mul(rate)
                );

                return enrichedOrder;
            })
            .catch(err => {
                throw err;
            }
        );          
    }

    updateEnrichedOrderbook = async (
        orderHash: string, 
        remMakerTokenAmout: BigNumber,
        remTakerTokenAmount: BigNumber
    ): Promise<boolean> => {
        if (this.state.enrichedOrderbook) {
            const enrichedOrderbook = Object.assign({}, this.state.enrichedOrderbook);

            let enrichedOrder = enrichedOrderbook.asks.find(order => {
                return ZeroEx.getOrderHashHex(order.signedOrder) === orderHash;
            });
    
            enrichedOrder = enrichedOrder || enrichedOrderbook.bids.find(order => {
                return ZeroEx.getOrderHashHex(order.signedOrder) === orderHash;
            });

            // We don't want to return undefined hence the need for this check
            if (!enrichedOrder) {
                return false;
            }

            enrichedOrder.remainingMakerTokenAmount = remMakerTokenAmout;
            enrichedOrder.remainingTakerTokenAmount = remTakerTokenAmount;

            await this.setState({ enrichedOrderbook });

            return true;
        }
        return false;
    }

    removeOrderFromEnrichedOrderbook = async (
        orderHash: string, 
    ): Promise<void> => {
        if (this.state.enrichedOrderbook) {
            const enrichedOrderbook = Object.assign({}, this.state.enrichedOrderbook);

            enrichedOrderbook.asks.filter(order => {
                return ZeroEx.getOrderHashHex(order.signedOrder) !== orderHash;
            });
    
            enrichedOrderbook.bids.filter(order => {
                return ZeroEx.getOrderHashHex(order.signedOrder) !== orderHash;
            });

            await this.setState({ enrichedOrderbook });
        }
    }

    // TODO: Implement special logic for Order fills and cancellations - Currently maker/taker amount is set to 0
    onOrderWatcherEvent = async (err: Error | null, orderState?: OrderState) => {
        if (orderState && orderState.isValid) {
            const orderRelevantState = orderState.orderRelevantState;
            
            this.updateEnrichedOrderbook(
                orderState.orderHash,
                orderRelevantState.remainingFillableMakerTokenAmount,
                orderRelevantState.remainingFillableTakerTokenAmount
            )
            .then((success: boolean) => {
                if (!success) {
                    return this.props.zeroEx.orderStateWatcher.removeOrder(orderState.orderHash);
                } else {
                    return this.calculateRateRange();
                }
            });
        } else if (orderState && !orderState.isValid) {
            // Invalid OrderState or non existent OrderState with Error
            this.props.zeroEx.orderStateWatcher.removeOrder(orderState.orderHash);

            // Remove order && recalculate rates
            this.removeOrderFromEnrichedOrderbook(orderState.orderHash)
                .then(this.calculateRateRange);            
        }
    }

    calculateRateRange = async () => {
        let baseToken = this.state.baseToken;
        let quoteToken = this.state.quoteToken;
        const tradeAction = this.state.tradeAction;
        const tokenQuantity = this.state.tokenQuantity;
        const enrichedOrderbook = this.state.enrichedOrderbook;

        let minExchangeRate;
        let maxExchangeRate;

        // (Ask, Buy) - Taker buys base token, Maker sells base token
        if (baseToken && 
            quoteToken && 
            tokenQuantity.greaterThan(0) &&
            tradeAction === 'Buy' && 
            enrichedOrderbook !== undefined
        ) {
            const asks: EnrichedSignedOrder[] = enrichedOrderbook.asks;

            baseToken = this.state.baseToken as Token;
            quoteToken = this.state.quoteToken as Token;

            let lowerBoundBaseTokenQuantity: BigNumber = new BigNumber(0);
            let lowerBoundQuoteTokenQuantity: BigNumber = new BigNumber(0);

            let upperBoundBaseTokenQuantity: BigNumber = new BigNumber(0);
            let upperBoundQuoteTokenQuantity: BigNumber = new BigNumber(0);

            // TODO: Save to state
            this.ordersToFill = new Map();

            // Calculate Lower Bound
            let i;
            for (i = 0; i < asks.length; i++) {
                const enrichedOrder: EnrichedSignedOrder = asks[i];
                if (lowerBoundBaseTokenQuantity.lessThan(tokenQuantity)) {
                    console.log(`lower bound signed order: ${JSON.stringify(enrichedOrder)}`);

                    const makerTokenAmount = ZeroEx.toUnitAmount(
                        new BigNumber(enrichedOrder.remainingMakerTokenAmount),
                        baseToken.decimals
                    );
        
                    const takerTokenAmount = ZeroEx.toUnitAmount(
                        new BigNumber(enrichedOrder.remainingTakerTokenAmount),
                        quoteToken.decimals
                    );

                    let baseTokenQuantityToFill = tokenQuantity.minus(lowerBoundBaseTokenQuantity);
                    let orderRate = takerTokenAmount.div(makerTokenAmount);
                    
                    baseTokenQuantityToFill = baseTokenQuantityToFill.lessThan(makerTokenAmount)
                    ? lowerBoundBaseTokenQuantity.add(baseTokenQuantityToFill)
                    : lowerBoundBaseTokenQuantity.add(makerTokenAmount);

                    lowerBoundBaseTokenQuantity = lowerBoundBaseTokenQuantity.add(baseTokenQuantityToFill);

                    let quoteTokenQuantityToFill = orderRate.mul(baseTokenQuantityToFill);
                    lowerBoundQuoteTokenQuantity = lowerBoundQuoteTokenQuantity.add(quoteTokenQuantityToFill);

                    const hashHex = ZeroEx.getOrderHashHex(enrichedOrder.signedOrder);
                    if (!this.ordersToFill.has(ZeroEx.getOrderHashHex(enrichedOrder.signedOrder))) {
                        this.ordersToFill.set(hashHex, enrichedOrder.signedOrder);
                    }
                } else {
                    break;
                }
            }

            // Calculate conservative threadshold for upper bound estimate. Currently 2x
            i = (i * 2) >= asks.length ? asks.length - 1 : (i * 2) ;

            // Calculate Upper Bound
            for (i; i >= 0; i--) {
                const enrichedOrder: EnrichedSignedOrder = asks[i];
                if ((upperBoundBaseTokenQuantity.lessThan(tokenQuantity))) {
                    
                    const makerTokenAmount = ZeroEx.toUnitAmount(
                        new BigNumber(enrichedOrder.remainingMakerTokenAmount),
                        baseToken.decimals
                    );
        
                    const takerTokenAmount = ZeroEx.toUnitAmount(
                        new BigNumber(enrichedOrder.remainingTakerTokenAmount),
                        quoteToken.decimals
                    );

                    console.log(`upper bound signed order: ${JSON.stringify(enrichedOrder)}`);
                    let baseTokenQuantityToFill = tokenQuantity.minus(upperBoundBaseTokenQuantity);
                    let orderRate = takerTokenAmount.div(makerTokenAmount);
                    
                    baseTokenQuantityToFill = baseTokenQuantityToFill.lessThan(makerTokenAmount)
                    ? upperBoundBaseTokenQuantity.add(baseTokenQuantityToFill)
                    : upperBoundBaseTokenQuantity.add(makerTokenAmount);

                    upperBoundBaseTokenQuantity = upperBoundBaseTokenQuantity.add(baseTokenQuantityToFill);

                    let quoteTokenQuantityToFill = orderRate.mul(baseTokenQuantityToFill);
                    upperBoundQuoteTokenQuantity = upperBoundQuoteTokenQuantity.add(quoteTokenQuantityToFill);

                    const hashHex = ZeroEx.getOrderHashHex(enrichedOrder.signedOrder);
                    if (!this.ordersToFill.has(ZeroEx.getOrderHashHex(enrichedOrder.signedOrder))) {
                        this.ordersToFill.set(hashHex, enrichedOrder.signedOrder);
                    }
                } else {
                    break;
                }
            }

            await this.setState({
                lowerBoundExchangeRate: lowerBoundQuoteTokenQuantity.div(lowerBoundBaseTokenQuantity),
                upperBoundExchangeRate: upperBoundQuoteTokenQuantity.div(upperBoundBaseTokenQuantity)
            });
        }
    }

    onClickTrade = async (event: React.MouseEvent<HTMLButtonElement>, data: ButtonProps) => {
        const takerAddress = this.props.accounts[0];
        const baseToken = this.state.baseToken as Token;
        const quoteToken = this.state.quoteToken as Token;
        const handleTxMsg = this.props.setTransactionMessageState;
        
        const fillQuantity = ZeroEx.toBaseUnitAmount(
            this.state.tokenQuantity,
            baseToken.decimals
        );

        if (this.ordersToFill.size > 0 
            && baseToken 
            && quoteToken 
            && fillQuantity.greaterThan(0)
        ) {
            handleTxMsg('LOADING');
            
            const orderArray = Array.from(this.ordersToFill.values());
            
            console.log('signed orders to fill:' + JSON.stringify(orderArray));
            console.log('Order fill amount:' + fillQuantity);
            
            try {
                const txMsg = await this.props.zeroEx.exchange.fillOrdersUpToAsync(
                    orderArray, 
                    fillQuantity, 
                    true, 
                    takerAddress
                );
                handleTxMsg('TRADE_SUCCESS', txMsg);
            } catch (error) {
                handleTxMsg('FAILURE', error.message);
            }
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
                            <Statistic size="small">
                                <Statistic.Value>{lowerBoundTokenQuantity} - {upperBoundTokenQuantity}</Statistic.Value>
                                <Statistic.Label>{q.symbol}</Statistic.Label>
                            </Statistic>
                        </Grid.Row>
                        <Grid.Row><h3>AT</h3></Grid.Row>
                        <Grid.Row>
                            <Statistic size="small">
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
                    <Statistic size="small">
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
                    onSnapshot={this.onRelayerSnapshot}
                    onUpdate={this.onRelayerUpdate}
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
                <Divider horizontal>You Will {tradeAction === 'Buy' ? 'Spend' : 'Purchase'}</Divider>
                {tokenStatistics}
                <div style={{margin: '1em', display: 'flex', justifyContent: 'center'}}>
                    <Form.Field 
                        required 
                        control={Checkbox} 
                        label="I agree to the Terms and Conditions"   
                    />
                </div>
                <div style={{margin: '1em', display: 'flex', justifyContent: 'center'}}>
                    <Form.Button onClick={this.onClickTrade}>
                        Trade
                    </Form.Button>
                </div>
            </Form>
        );
    }
}

import * as React from 'react';
import { promisify } from '@0xproject/utils';
import Divider from 'semantic-ui-react/dist/commonjs/elements/Divider/Divider';
import { Button, Container, Form, Radio, TextArea, Checkbox, Input, DropdownItemProps, Grid } from 'semantic-ui-react';
import { ZeroEx } from '0x.js/lib/src/0x';
import Faucet from '../../../components/Faucet';
import { Token } from '0x.js';
import { Dictionary } from 'lodash';
import { TokenAllowance } from '../../App';
import Dropdown, { DropdownProps } from 'semantic-ui-react/dist/commonjs/modules/Dropdown/Dropdown';
import * as _ from 'lodash';

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
}

export default class TradeTokens extends React.Component<Props, State> {
    
    constructor(props: Props) {
        super(props);

        this.state = {
            tradeAction: 'Buy',
            tokenQuantity: 0,
            baseToken: undefined,
            quoteToken: undefined
        };
    }

    fetchProxyTokenList = async () => {
        const tokens = await this.props.zeroEx.tokenRegistry.getTokensAsync();
    }

    handleTradeActionChange = (e, { value }) => this.setState({ tradeAction: value });

    handleBaseTokenDropDownItemSelected = (e, data: DropdownProps) => {
        const itemProp = _.find(data.options, {value: data.value}) as DropdownItemProps;
        this.setState({ baseToken: itemProp.token });
    }

    handleQuoteTokenDropDownItemSelected = (e, data: DropdownProps) => {
        const itemProp = _.find(data.options, {value: data.value}) as DropdownItemProps;
        this.setState({ quoteToken: itemProp.token });
    }

    render() {
        const zeroExProxyTokens: Token[] = this.props.zeroExProxyTokens;
        const tokensWithAllowance: Dictionary<TokenAllowance> = this.props.tokensWithAllowance;
        const baseToken = this.state.baseToken;
        const quoteToken = this.state.quoteToken;

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

        return (
            <Form style={{ height: '100%' }}>
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
                <div style={{display: 'flex', justifyContent: 'center'}}>
                    <Form.Field 
                        required 
                        control={Checkbox} 
                        label="I agree to the Terms and Conditions"   
                    />
                </div>
                <div style={{margin: '2em', display: 'flex', justifyContent: 'center'}}>
                    <Form.Button>
                        Trade
                    </Form.Button>
                </div>
            </Form>
        );
    }
}

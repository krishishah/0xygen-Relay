import * as React from 'react';
import * as _ from 'lodash';
import { ZeroEx, Token } from '0x.js';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as Web3 from 'web3';
import { BigNumber } from '@0xproject/utils';
import { Button, Container, Table, Header, List, Radio, Image } from 'semantic-ui-react';
import { BalanceTableRow } from '../../containers/Account/BalanceTableRow';
import { TokenBalance } from '../../containers/App';
import { Dictionary } from 'lodash';
import { TokenAllowance } from '../../containers/App';

interface Props {
    allowances: Dictionary<TokenAllowance>;
    setTokenAllowance: (tokenAllowance: TokenAllowance) => void;
}

const ETHER_TOKEN_NAME = 'ETH';

export default class TokenList extends React.Component<Props> {

    constructor(props: Props) {
        super(props);
    }

    render() {
        
        const allowances = this.props.allowances;
        const onChange = this.props.setTokenAllowance;
        if (Object.keys(allowances).length > 0) {
            const TokenAllowances = _.map(allowances, (tokenAllowance: TokenAllowance, key: string) => {
                return (
                    <List.Item key={tokenAllowance.token.symbol} style={{textAlign: 'left'}}>
                        <Image floated="left" avatar src={`/token_icons/${tokenAllowance.token.symbol}.png`}/>
                        <List.Content>
                            <List.Header>{tokenAllowance.token.symbol}</List.Header>
                            <List.Description>{tokenAllowance.token.name}</List.Description>
                        </List.Content>
                        <List.Content floated="right">
                            <Radio
                                toggle={true} 
                                checked={tokenAllowance.allowance.greaterThan(0)}
                                onChange={() => onChange(tokenAllowance)}
                            />
                        </List.Content>
                    </List.Item>
                );
            });

            return (
                <List verticalAlign="middle">
                    {TokenAllowances}
                </List>
            );
        }
        return null;
    }
}

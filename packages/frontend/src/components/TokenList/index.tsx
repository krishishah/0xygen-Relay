import * as React from 'react';
import * as _ from 'lodash';
import { ZeroEx, Token } from '0x.js';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as Web3 from 'web3';
import { BigNumber } from '@0xproject/utils';
import { Button, Container, Table, Header, List, Radio } from 'semantic-ui-react';
import { BalanceTableRow } from '../../containers/Account/BalanceTableRow/balanceTableRow';
import { TokenBalance } from '../../containers/App';
import { Dictionary } from 'lodash';
import { TokenAllowance } from '../../containers/Steps/SetAllowances';

interface Props {
    allowances: Dictionary<TokenAllowance>;
}

const ETHER_TOKEN_NAME = 'ETH';

export default class TokenList extends React.Component<Props, {}> {

    constructor(props: Props) {
        super(props);
    }

    render() {
        
        const allowances = this.props.allowances;

        if (Object.keys(allowances).length > 0) {
            
            const TokenAllowances = _.map(allowances, (tokenAllowance: TokenAllowance, key: string) => {
                return (
                    <List.Item key={tokenAllowance.token.symbol} style={{textAlign: 'left'}}>
                        <List.Content floated="right">
                            <Radio 
                                toggle={true} 
                                checked={tokenAllowance.allowance.greaterThan(0)}
                            />
                        </List.Content>
                        <List.Content floated="left">
                            <List.Header>{tokenAllowance.token.symbol}</List.Header>
                            <List.Description>{tokenAllowance.token.name}</List.Description>
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

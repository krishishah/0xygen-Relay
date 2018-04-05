import * as React from 'react';
import * as _ from 'lodash';
import { ZeroEx, Token } from '0x.js';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as Web3 from 'web3';
import { BigNumber } from '@0xproject/utils';
import { Button, Container, Table, Header } from 'semantic-ui-react';
import { BalanceTableRow } from '../../containers/Account/BalanceTableRow/balanceTableRow';
import { TokenBalance } from '../../containers/App';
import { Dictionary } from 'lodash';

interface Props {
    web3: Web3;
    zeroEx: ZeroEx;
    accounts: string[];
    balances: Dictionary<Dictionary<BigNumber>>;
    fetchAccountDetailsAsync: () => void;
}

const ETHER_TOKEN_NAME = 'ETH';

export default class Account extends React.Component<Props, {}> {

    constructor(props: Props) {
        super(props);
    }

    render() {
        const account = this.props.accounts[0];
        const balances = this.props.balances[account];
        
        if (balances) {
            const accountString = `${account}`;
            const tokenBalances = _.map(balances, (v: BigNumber, k: string) => {
                const pairString = `${k}: ${v}`;
                return (
                    <BalanceTableRow key={pairString} token={k} value={v.toString()}/>
                );
            });

            return (
                <div>
                    <h2>Wallet</h2>
                    <h4>Account Address: {accountString}</h4>
                    <Container style={{display: 'flex', justifyContent: 'center', padding: '2em'}}>
                        <Table basic="very" celled collapsing>
                            <Table.Header>
                                <Table.Row>
                                    <Table.HeaderCell>Token</Table.HeaderCell>
                                    <Table.HeaderCell>Value</Table.HeaderCell>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {tokenBalances}
                            </Table.Body>
                        </Table>
                    </Container>
                </div>
            );
        } else {
            return (
                <Container textAlign="center">
                    <p> Detecting Metamask... Please ensure Metamask is unlocked </p>
                    <Button id="fetchAccountBalances" onClick={this.props.fetchAccountDetailsAsync}>
                        Fetch Balances
                    </Button>
                </Container>
            );
        }
    }
}

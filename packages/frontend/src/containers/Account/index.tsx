import * as React from 'react';
import * as _ from 'lodash';
import { ZeroEx, Token } from '0x.js';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as Web3 from 'web3';
import { BigNumber } from '@0xproject/utils';
import { Button, Container } from 'semantic-ui-react';

interface Props {
    web3: Web3;
    zeroEx: ZeroEx;
}

interface TokenBalance {
    token: Token;
    balance: BigNumber;
}

const ETHER_TOKEN_NAME = 'ETH';

export default class Account extends React.Component<Props, {}> {
    state = { accounts: [''], balances: {} };
    public _pollingIntervalId: any;
    private _web3Wrapper: Web3Wrapper;
    constructor(props: Props) {
        super(props);
        this._web3Wrapper = new Web3Wrapper(this.props.web3.currentProvider);

        // Poll for the account details and keep it refreshed
        this._pollingIntervalId = setInterval(() => {
            this.fetchAccountDetailsAsync();
        // tslint:disable-next-line:align
        }, 3000);
    }

    fetchAccountDetailsAsync = async () => {
        // Get the Available Addresses from the Web3 Provider inside of ZeroEx
        const addresses = await this.props.zeroEx.getAvailableAddressesAsync();
        // Request all of the tokens and their details from the 0x Token Registry
        const tokens = await this.props.zeroEx.tokenRegistry.getTokensAsync();
        const address = addresses[0];
        if (!address) {
            return;
        }
        const balances = {};
        balances[address] = {};
        // Fetch all the Balances for all of the tokens in the Token Registry
        const allBalancesAsync = _.map(tokens, async (token: Token): Promise<TokenBalance> => {
            try {
                const balance = await this.props.zeroEx.token.getBalanceAsync(token.address, address);
                const numberBalance = new BigNumber(balance);
                return { token: token, balance: numberBalance };
            } catch (e) {
                console.log(e);
                return { token: token, balance: new BigNumber(0) };
            }
        });

        // Convert all of the Units into more Human Readable numbers
        // Many ERC20 tokens go to 18 decimal places
        const results = await Promise.all(allBalancesAsync);
        _.each(results, (tokenBalance: TokenBalance) => {
            if (tokenBalance.balance && tokenBalance.balance.gt(0)) {
                balances[address][tokenBalance.token.name] = ZeroEx.toUnitAmount(
                    tokenBalance.balance,
                    tokenBalance.token.decimals
                );
            }
        });

        // Fetch the Balance in Ether
        try {
            const ethBalance = await this._web3Wrapper.getBalanceInWeiAsync(address);
            if (ethBalance) {
                const ethBalanceNumber = new BigNumber(ethBalance);
                balances[address][ETHER_TOKEN_NAME] = ZeroEx.toUnitAmount(new BigNumber(ethBalanceNumber), 18);
            }
        } catch (e) {
            console.log(e);
        }

        // Update the state in React
        this.setState((prev, props) => {
            return { ...prev, balances: balances, accounts: addresses };
        });
    };

    render() {
        const account = this.state.accounts[0];
        const balances = this.state.balances[account];
        if (balances) {
            const accountString = `${account}`;

            const balancesString = _.map(balances, (v: BigNumber, k: string) => {
                const pairString = `${k}: ${v}`;
                return <p key={k}>{pairString}</p>;
            });
            return (
                <Container textAlign="center">
                    <p>
                        <strong>Account</strong> {accountString}
                    </p>
                    <strong> Balances </strong>
                    {balancesString}
                </Container>
            );
        } else {
            return (
                <Container textAlign="center">
                    <p> Detecting Metamask... Please ensure Metamask is unlocked </p>
                    <Button id="fetchAccountBalances" onClick={this.fetchAccountDetailsAsync}>
                        Fetch Balances
                    </Button>
                </Container>
            );
        }
    }
}

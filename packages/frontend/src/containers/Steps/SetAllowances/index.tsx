import * as React from 'react';
import * as Web3 from 'web3';
import { ZeroEx, SignedOrder, Token } from '0x.js';
import { relayerResponseJsonParsers } from '@0xproject/connect/lib/src/utils/relayer_response_json_parsers';
import { BigNumber } from 'bignumber.js';
import { Dictionary } from 'lodash';
import * as _ from 'lodash';
import { 
    Button, 
    Divider, 
    Container, 
    Dropdown, 
    DropdownItemProps, 
    DropdownMenuProps, 
    DropdownItem, 
    DropdownProps
} from 'semantic-ui-react';
import TokenList from '../../../components/TokenList';
import { SyntheticEvent } from 'react';

export interface TokenAllowance {
    token: Token;
    allowance: BigNumber;
}

interface Props {
    zeroEx: ZeroEx;
    accounts: string[];
 }

interface State {
    tokensChosenOrWithAllowances: Dictionary<TokenAllowance>;
    zeroExRegistryTokens: DropdownItemProps[];
 }

export default class SetAllowances extends React.Component<Props, State> {
    
    constructor(props: Props) {
        super(props);

        this.state = {
            tokensChosenOrWithAllowances: {},
            zeroExRegistryTokens: []
        };
    }

    componentDidMount() {
        this.fetchAllowances();

        setInterval(() => {
            this.fetchAllowances();
        // tslint:disable-next-line:align
        }, 5000);
    }

    private fetchTokenAllowance = async (token: Token) => {
        const zeroEx: ZeroEx = this.props.zeroEx;
        const account = this.props.accounts[0];

        try {
            const allowance = await zeroEx.token.getProxyAllowanceAsync(token.address, account);
            return { token: token, allowance: allowance };
        } catch (e) {
            console.log(e);
            return { token: token, allowance: new BigNumber(0) };
        }
    }

    private setTokenAllowance = async (tokenAllowance: TokenAllowance) => {
        const zeroEx: ZeroEx = this.props.zeroEx;
        const account = this.props.accounts[0];
        
        if (tokenAllowance.allowance.equals(0)) {
            try {
                const txHash = await zeroEx.token.setUnlimitedProxyAllowanceAsync(
                    tokenAllowance.token.address, 
                    account
                );
            } catch (e) {
                console.log(e);
            }
        }
    }
    
    private fetchAllowances = async () => {
        const zeroEx: ZeroEx = this.props.zeroEx;
        const account = this.props.accounts[0];
        let tokensChosenOrWithAllowances = this.state.tokensChosenOrWithAllowances;

        const tokens = await this.props.zeroEx.tokenRegistry.getTokensAsync();
            
        const zeroExRegistryTokens = _.map(tokens, (token: Token) =>{
            return {
                key: token.symbol, 
                token: token, 
                text: `${token.symbol}: ${token.name}`,
                onClick: this.chooseTokenFromDropDown,
                active: tokensChosenOrWithAllowances[token.symbol] !== undefined
            };
        });

        const zeroExRegistryTokenAllowancePromises = _.map(tokens, async (token: Token): Promise<TokenAllowance> => {
            return await this.fetchTokenAllowance(token);
        });

        const zeroExRegistryTokenAllowances = await Promise.all(zeroExRegistryTokenAllowancePromises);

        // Convert all of the Units into more Human Readable numbers
        // Many ERC20 tokens go to 18 decimal places
        _.each(zeroExRegistryTokenAllowances, (tokenAllowance: TokenAllowance) => {
            if (tokenAllowance.allowance && tokenAllowance.allowance.gt(0)) {
                tokenAllowance.allowance = ZeroEx.toUnitAmount(
                    tokenAllowance.allowance,
                    tokenAllowance.token.decimals
                );
                tokensChosenOrWithAllowances[tokenAllowance.token.symbol] = tokenAllowance;
            }
        });

        this.setState({
            tokensChosenOrWithAllowances,
            zeroExRegistryTokens
        });
    }

    private chooseTokenFromDropDown = async (
        event: React.MouseEvent<HTMLDivElement>, 
        data: DropdownItemProps
    ) => {
        const zeroExRegistryToken: Token = data.token;
        const newTokenAllowace = await this.fetchTokenAllowance(zeroExRegistryToken);

        const tokenSymbol = zeroExRegistryToken.symbol;
        const tokensChosenOrWithAllowances = Object.assign({}, this.state.tokensChosenOrWithAllowances);
        tokensChosenOrWithAllowances[zeroExRegistryToken.symbol] = newTokenAllowace;

        this.setState({tokensChosenOrWithAllowances});
    }

    // tslint:disable-next-line:member-ordering
    render() {
        const zeroExRegistryTokens = this.state.zeroExRegistryTokens;

        return (
            <div>
                <div>
                    <Dropdown 
                        placeholder="Select Token"
                        closeOnChange={true}
                        fluid={true} 
                        selection={true} 
                        options={zeroExRegistryTokens}
                    />
                </div>
                <br/>
                <div>
                    <TokenList 
                        allowances={this.state.tokensChosenOrWithAllowances}
                        setTokenAllowance={this.setTokenAllowance}
                    />
                </div>
            </div>
        );
    }
}

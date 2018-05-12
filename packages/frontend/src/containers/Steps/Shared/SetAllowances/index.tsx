import * as React from 'react';
import TokenList from '../../../../components/TokenList';
import { SyntheticEvent } from 'react';
import { TokenAllowance } from '../../../App';
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

interface Props {
    zeroEx: ZeroEx;
    accounts: string[];
    tokensWithAllowances: Dictionary<TokenAllowance>;
    zeroExRegistryTokens: Token[];
    fetchAllowances: () => Promise<void>;
    fetchTokenAllowance: (token: Token) => Promise<TokenAllowance>;
    setTokenAllowance: (tokenAllowance: TokenAllowance) => Promise<void>;
}

interface State {
    tokensChosen: Dictionary<TokenAllowance>;
}

export default class SetAllowances extends React.Component<Props, State> {
    
    constructor(props: Props) {
        super(props);

        this.state = {
            tokensChosen: {}
        };
    }

    componentDidMount() {
        this.props.fetchAllowances();

        setInterval(() => {
            this.props.fetchAllowances();
        // tslint:disable-next-line:align
        }, 5000);
    }

    private chooseTokenFromDropDown = async (
        event: React.MouseEvent<HTMLDivElement>, 
        data: DropdownItemProps
    ) => {
        const zeroExRegistryToken: Token = data.token;
        const tokensWithAllowances = this.props.tokensWithAllowances;

        if (!tokensWithAllowances[zeroExRegistryToken.symbol]) {
            const newTokenAllowace = await this.props.fetchTokenAllowance(zeroExRegistryToken);

            if (newTokenAllowace.allowance.gt(0)) {
                //Temporary
                this.props.fetchAllowances();
            } else {
                const tokenSymbol = zeroExRegistryToken.symbol;
                
                let tokensChosen = Object.assign({}, this.state.tokensChosen);

                tokensChosen[tokenSymbol] = newTokenAllowace;
                
                const filteredTokensChosen = _.omitBy(tokensChosen, (v: TokenAllowance, k: string) => {
                    return tokensWithAllowances[k];
                }) as Dictionary<TokenAllowance>;
                        
                this.setState({tokensChosen: filteredTokensChosen});
            }
        }
    }

    // tslint:disable-next-line:member-ordering
    render() {
        const zeroExRegistryTokens = this.props.zeroExRegistryTokens;
        const tokensChosen = this.state.tokensChosen;
        const tokensWithAllowances = this.props.tokensWithAllowances;

        let tokensChosenOrWithAllowances = Object.assign({}, tokensChosen, tokensWithAllowances);
        
        const tokenDropDownItems = _.map(zeroExRegistryTokens, (token: Token) => {
            return {
                key: token.symbol, 
                token: token, 
                text: `${token.symbol}: ${token.name}`,
                onClick: this.chooseTokenFromDropDown,
                active: this.props.tokensWithAllowances[token.symbol] !== undefined
            };
        });

        return (
            <div>
                <div>
                    <Dropdown 
                        placeholder="Select Token"
                        closeOnChange={true}
                        fluid={true} 
                        selection={true} 
                        options={tokenDropDownItems}
                    />
                </div>
                <br/>
                <div>
                    <TokenList 
                        allowances={tokensChosenOrWithAllowances}
                        setTokenAllowance={this.props.setTokenAllowance}
                    />
                </div>
            </div>
        );
    }
}

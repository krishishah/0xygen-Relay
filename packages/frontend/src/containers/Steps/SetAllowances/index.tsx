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
    DropdownItem 
} from 'semantic-ui-react';

interface TokenAllowance {
    token: Token;
    allowance: BigNumber;
}

interface Props {
    zeroEx: ZeroEx;
    accounts: string[];
 }

interface State {
    tokensWithAllowances: Dictionary<TokenAllowance>;
    zeroExRegistryTokens: DropdownItemProps[];
 }

export default class SetAllowances extends React.Component<Props, State> {
    
    constructor(props: Props) {
        super(props);

        this.state = {
            tokensWithAllowances: {},
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
    
    private fetchAllowances = async () => {
        const zeroEx: ZeroEx = this.props.zeroEx;
        // const account: string = await this.props.zeroEx.getAvailableAddressesAsync()[0];
        const account = this.props.accounts[0];
        let tokensWithAllowances = {};

        const tokens = await this.props.zeroEx.tokenRegistry.getTokensAsync();
            
        const zeroExRegistryTokens = _.map(tokens, (token: Token) =>{
            return {key: token.symbol, value: token.symbol, text: `${token.symbol}: ${token.name}`};
        });

        const zeroExRegistryTokenAllowancePromises = _.map(tokens, async (token: Token): Promise<TokenAllowance> => {
            try {
                const allowance = await zeroEx.token.getProxyAllowanceAsync(token.address, account);
                return { token: token, allowance: allowance };
            } catch (e) {
                console.log(e);
                return { token: token, allowance: new BigNumber(0) };
            }
        });

        const zeroExRegistryTokenAllowances = await Promise.all(zeroExRegistryTokenAllowancePromises);

        // Convert all of the Units into more Human Readable numbers
        // Many ERC20 tokens go to 18 decimal places
        _.each(zeroExRegistryTokenAllowances, (tokenAllowance: TokenAllowance) => {
            if (tokenAllowance.allowance && tokenAllowance.allowance.gt(0)) {
                tokensWithAllowances[tokenAllowance.token.symbol] = tokenAllowance;
            }
        });

        this.setState({
            tokensWithAllowances,
            zeroExRegistryTokens
        });
    }


    private async dispenseETH(): Promise<void> {
        const addresses = await this.props.zeroEx.getAvailableAddressesAsync();
        const address = addresses[0];
        const url = `https://faucet.0xproject.com/ether/${address}`;
        await fetch(url);
    }
    private async orderWETH(): Promise<void> {
        const addresses = await this.props.zeroEx.getAvailableAddressesAsync();
        const address = addresses[0];
        const url = `https://faucet.0xproject.com/order/weth/${address}`;
        const response = await fetch(url);
        const bodyJson = await response.json();

        const signedOrder: SignedOrder = relayerResponseJsonParsers.parseOrderJson(bodyJson);
        console.log(signedOrder);

        const fillAmount = ZeroEx.toBaseUnitAmount(signedOrder.takerTokenAmount, 18);
        try {
            await this.props.zeroEx.exchange.fillOrderAsync(signedOrder, fillAmount, true, address);
        } catch (e) {
            console.log(e);
        }
    }
    // tslint:disable-next-line:member-ordering
    render() {
        const zeroExRegistryTokens = this.state.zeroExRegistryTokens;

        return (
            <Container textAlign="center">
                  <Dropdown placeholder='Select Token' fluid search selection options={zeroExRegistryTokens} />
            </Container>
        );
    }
}

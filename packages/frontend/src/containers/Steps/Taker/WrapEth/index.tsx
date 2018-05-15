import { ZeroEx, Token } from '0x.js';
import * as React from 'react';
import { BigNumber } from 'bignumber.js';
import { 
    Container, 
    Table, 
    Header, 
    Image, 
    Input, 
    Button, 
    ButtonProps,
    InputOnChangeData,
    TextArea
} from 'semantic-ui-react';
import { UserActionMessageStatus } from '../../../../components/UserActionMessage';

interface Props {
    zeroEx: ZeroEx;
    wethToken: Token;
    accounts: string[];
    setTransactionMessageState: (status: UserActionMessageStatus, message?: string) => void;
}

interface State {
    wrapAmount: BigNumber;
    unwrapAmount: BigNumber;
}

export default class WrapEth extends React.Component<Props, State> {

    constructor(props: Props) {
        super(props);
        this.state = {
            wrapAmount: new BigNumber(0),
            unwrapAmount: new BigNumber(0)
        };
    }
    
    wrapEth = async (event: React.MouseEvent<HTMLButtonElement>, data: ButtonProps) => {
        this.props.setTransactionMessageState('LOADING', 'Please wait, wrapping your ETH');

        // Number of ETH to convert to WETH
        const ethToConvert = ZeroEx.toBaseUnitAmount(
            this.state.wrapAmount,
            this.props.wethToken.decimals
        );

        try {
            const convertEthTxHash = await this.props.zeroEx.etherToken.depositAsync(
                this.props.wethToken.address, 
                ethToConvert, 
                this.props.accounts[0]
            );
            await this.props.zeroEx.awaitTransactionMinedAsync(convertEthTxHash);
            this.props.setTransactionMessageState('TRADE_SUCCESS', convertEthTxHash);
        } catch (e) {
            this.props.setTransactionMessageState('FAILURE', e);
        }
    }

    unwrapEth = async (event: React.MouseEvent<HTMLButtonElement>, data: ButtonProps) => {
        this.props.setTransactionMessageState('LOADING', 'Please wait, unwrapping your ETH');

        // Number of WETH to convert to ETH
        const ethToConvert = ZeroEx.toBaseUnitAmount(
            this.state.wrapAmount,
            this.props.wethToken.decimals
        );

        try {
            const convertEthTxHash = await this.props.zeroEx.etherToken.withdrawAsync(
                this.props.wethToken.address, 
                ethToConvert, 
                this.props.accounts[0]
            );
            await this.props.zeroEx.awaitTransactionMinedAsync(convertEthTxHash);
            this.props.setTransactionMessageState('TRADE_SUCCESS', convertEthTxHash);
        } catch (e) {
            this.props.setTransactionMessageState('FAILURE', e);
        }
    }

    onWrapQuantityChange = (event: React.SyntheticEvent<HTMLInputElement>, data: InputOnChangeData) => {
        if (data.value) {
            try {
                this.setState({wrapAmount: new BigNumber(data.value)});
            } catch(e) {
                console.log('Invalid Wrap Value: ' + e);
            }
        }
    }

    onUnwrapQuantityChange = (event: React.SyntheticEvent<HTMLInputElement>, data: InputOnChangeData) => {
        if (data.value) {
            try {
                this.setState({unwrapAmount: new BigNumber(data.value)});
            } catch(e) {
                console.log('Invalid Unwrap Value: ' + e);
            }
        }
    }

    render() {
        const wrapEthIconDir = '/token_icons/wrapEth.png';
        const unwrapEthIconDir = '/token_icons/unwrapEth.png';

        return (
            <div>
                <Header size="small">
                    Wrap ETH into an ERC20-compliant Ether token. 1 ETH = 1 WETH.
                </Header>
                <Table basic="very" collapsing style={{width: '100%'}}>
                    <Table.Header>
                        <Table.Row>
                            <Table.HeaderCell>Asset</Table.HeaderCell>
                            <Table.HeaderCell>Quantity</Table.HeaderCell>
                            <Table.HeaderCell>Action</Table.HeaderCell>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                    <Table.Row >
                        <Table.Cell image>
                            <Image size="tiny" src={wrapEthIconDir}/>
                        </Table.Cell>
                        <Table.Cell style={{width: '30%'}}>
                            <Input
                                placeholder="ETH Quantity"
                                onChange={this.onWrapQuantityChange}
                            />
                        </Table.Cell>
                        <Table.Cell style={{width: '40%'}}>
                            <Button onClick={this.wrapEth}>
                                Wrap
                            </Button>
                        </Table.Cell>
                    </Table.Row> 
                    <Table.Row >
                        <Table.Cell>
                            <Image size="tiny" src={unwrapEthIconDir}/>
                        </Table.Cell>
                        <Table.Cell style={{width: '30%'}}>
                            <Input
                                placeholder="ETH Quantity"
                                onChange={this.onUnwrapQuantityChange}
                            />
                        </Table.Cell>
                        <Table.Cell style={{width: '40%'}}>
                            <Button onClick={this.unwrapEth}>
                                Unwrap
                            </Button>
                        </Table.Cell>
                    </Table.Row> 
                    </Table.Body>
                </Table>
            </div>
        );
    }
}
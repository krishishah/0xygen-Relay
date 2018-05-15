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
    TextArea,
    Statistic,
    Form,
    ButtonGroup,
    Segment,
    Divider
} from 'semantic-ui-react';
import { UserActionMessageStatus } from '../../../../components/UserActionMessage';

interface Props {
    zeroEx: ZeroEx;
    wethToken: Token;
    accounts: string[];
    setTransactionMessageState: (status: UserActionMessageStatus, message?: string) => void;
}

interface State {
    quantity: BigNumber;
}

export default class WrapEth extends React.Component<Props, State> {

    constructor(props: Props) {
        super(props);
        this.state = {
            quantity: new BigNumber(0),
        };
    }
    
    wrapEth = async (event: React.MouseEvent<HTMLButtonElement>, data: ButtonProps) => {
        this.props.setTransactionMessageState('LOADING', 'Please wait, wrapping your ETH');

        // Number of ETH to convert to WETH
        const ethToConvert = ZeroEx.toBaseUnitAmount(
            this.state.quantity,
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
            this.state.quantity,
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

    onQuantityChange = (event: React.SyntheticEvent<HTMLInputElement>, data: InputOnChangeData) => {
        if (data.value) {
            try {
                this.setState({quantity: new BigNumber(data.value)});
            } catch(e) {
                console.log('Invalid Wrap Value: ' + e);
            }
        }
    }

    render() {
        const wrapEthIconDir = '/token_icons/wrapEth.png';
        const unwrapEthIconDir = '/token_icons/unwrapEth.png';

        return (
            <Form style={{ height: '100%' }}>
                <Header size="small" textAlign="center">
                    1 ETH = 1 WETH
                    <Header.Subheader>
                        Wrap ETH into an ERC20-compliant Ether token.
                    </Header.Subheader>
                </Header>
                <div style={{display: 'flex', justifyContent: 'center'}}>
                    <Statistic.Group>
                        <Statistic>
                            <Statistic.Value>
                                <Image src={wrapEthIconDir}/>
                            </Statistic.Value>
                            <Statistic.Label>Wrap ETH</Statistic.Label>
                        </Statistic>
                        <Statistic>
                            <Statistic.Value>
                                <Image src={unwrapEthIconDir}/>
                            </Statistic.Value>
                            <Statistic.Label>Unwrap ETH</Statistic.Label>
                        </Statistic>
                    </Statistic.Group>
                </div>
                <Form.Input
                    label="Token Quantity"
                    required
                    onChange={this.onQuantityChange}
                />
                <div style={{margin: '1em', display: 'flex', justifyContent: 'center'}}>
                    <ButtonGroup>
                        <Button onClick={this.wrapEth}>Wrap ETH</Button>
                        <Button.Or />
                        <Button onClick={this.unwrapEth}>Unwrap ETH</Button>
                    </ButtonGroup>
                </div>
            </Form>
        );
    }
}
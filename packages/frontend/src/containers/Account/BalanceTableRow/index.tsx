import * as React from 'react';
import { Button, Dropdown, Menu, Table, Header, Image } from 'semantic-ui-react';
import { BigNumber } from 'bignumber.js';

interface State {}

interface Props {
    tokenSymbol: string;
    tokenName: string;
    value: string;
}

export class BalanceTableRow extends React.Component<Props, State> {

    constructor(props: Props) {
        super(props);
    }

    render() {
        const tokenImageDir = `/token_icons/${this.props.tokenSymbol}.png`;
        return (
            <Table.Row >
                <Table.Cell>
                    <Header as="h5" image>
                        <Image src={tokenImageDir} />
                        <Header.Content>
                            {this.props.tokenSymbol}
                            <Header.Subheader>
                                {this.props.tokenName}
                            </Header.Subheader>
                        </Header.Content>
                    </Header>
                </Table.Cell>
                <Table.Cell>
                    {this.props.value}
                </Table.Cell>
            </Table.Row> 
        );
    }
}
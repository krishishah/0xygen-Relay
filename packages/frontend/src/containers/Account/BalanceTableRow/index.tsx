import * as React from 'react';
import { Button, Dropdown, Menu, Table, Header } from 'semantic-ui-react';
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
        return (
            <Table.Row >
                <Table.Cell>
                    <Header as="h4">
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
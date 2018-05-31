import * as React from 'react';
import { Token } from '0x.js';
import BigNumber from 'bignumber.js';
import {
    Segment,
    Grid,
    Statistic,
    Message,
    Icon
} from 'semantic-ui-react';

export interface TokenRateStatistics {
    baseToken: Token;
    quoteToken: Token;
    tokenQuantity: BigNumber;
    lowerBoundExchangeRate: BigNumber;
    upperBoundExchangeRate: BigNumber; 
}

export interface TokenStatisticsPlaceholder {
    quoteToken?: Token;
}

interface Props {
    tokenRateStatistics?: TokenRateStatistics;
    placeholder?: TokenStatisticsPlaceholder;
    warning?: string[];
}

export class TokenStatistics extends React.Component<Props> {

    constructor(props: Props) {
        super(props);
    }

    render() {

        let tokenStatistics;

        if (this.props.warning) {
            tokenStatistics = (
            <Message 
                large 
                visible 
                warning 
                header="Sorry, We can't fill your order."
                list={this.props.warning}
            />
            );
        } else if (this.props.tokenRateStatistics) {
            const baseToken = this.props.tokenRateStatistics.baseToken;
            const quoteToken = this.props.tokenRateStatistics.quoteToken;
            const tokenQuantity = this.props.tokenRateStatistics.tokenQuantity;
            const lowerBoundExchangeRate = this.props.tokenRateStatistics.lowerBoundExchangeRate;
            const upperBoundExchangeRate = this.props.tokenRateStatistics.upperBoundExchangeRate;

            const lbRateString = lowerBoundExchangeRate.toPrecision(6);
            const ubRateString = upperBoundExchangeRate.toPrecision(6);
            const lowerBoundTokenQuantity = tokenQuantity.mul(lowerBoundExchangeRate).toPrecision(6);
            const upperBoundTokenQuantity = tokenQuantity.mul(upperBoundExchangeRate).toPrecision(6);
            const b = baseToken as Token;
            const q = quoteToken as Token;

            tokenStatistics = (
                <Segment>
                    <Grid rows={3} textAlign="center" style={{margin: '1em 1em 1em 1em'}}>
                        <Grid.Row>
                            <Statistic size="small">
                                <Statistic.Value>{lowerBoundTokenQuantity} - {upperBoundTokenQuantity}</Statistic.Value>
                                <Statistic.Label>{q.symbol}</Statistic.Label>
                            </Statistic>
                        </Grid.Row>
                        <Grid.Row><h3>AT</h3></Grid.Row>
                        <Grid.Row>
                            <Statistic size="small">
                                <Statistic.Value>{lbRateString} - {ubRateString}</Statistic.Value>
                                <Statistic.Label>{b.symbol}/{q.symbol}</Statistic.Label>
                            </Statistic>
                        </Grid.Row>
                    </Grid>
                </Segment>
            );
        } else if (this.props.placeholder) {
            const quoteToken = this.props.placeholder.quoteToken;

            tokenStatistics = ( 
                <Segment textAlign="center">
                    <Statistic size="small">
                        <Statistic.Value>0</Statistic.Value>
                        <Statistic.Label>{quoteToken ? quoteToken.symbol : 'WETH'}</Statistic.Label>
                    </Statistic>
                </Segment>
            );
        }

        return tokenStatistics;
    }
}

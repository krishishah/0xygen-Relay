import * as React from 'react';
import { Button, Dropdown, Menu, Step, Icon } from 'semantic-ui-react';

export class EasyTradeSteps extends React.Component {

  render() {
    return (
        <Step.Group widths={3}>
            <Step active={true}>
                <Icon name="pencil" />
                <Step.Content>
                <Step.Title>Allowances</Step.Title>
                <Step.Description>Set Allowances for tokens you'd like to trade</Step.Description>
                </Step.Content>
            </Step>
            <Step disabled={true}>
                <Icon name="exchange" />
                <Step.Content>
                <Step.Title>Trade</Step.Title>
                <Step.Description>Exchange Tokens at a given rate</Step.Description>
                </Step.Content>
            </Step>
            <Step disabled={true}>
                <Icon name="check circle" />
                <Step.Content>
                <Step.Title>Confirm Transaction</Step.Title>
                <Step.Description>Transaction Receipt</Step.Description>
                </Step.Content>
            </Step>
        </Step.Group>
    );
  }
}
import * as React from 'react';
import { Button, Dropdown, Menu, Step, Icon, StepProps } from 'semantic-ui-react';

export type SimpleTradeStep = 'Trade' | 'Allowance' | 'ConfirmTransaction';

interface Props {
    activeStep: SimpleTradeStep;
    changeStep: (newStep: SimpleTradeStep) => Promise<void>;
}

export class SimpleTradeStepsHeader extends React.Component<Props> {

    constructor(props: Props) {
        super(props);
    }

    changeStep = (event: React.MouseEvent<HTMLAnchorElement>, data: StepProps) => {
        this.props.changeStep(data.id);
    }

    render() {
        const activeStep = this.props.activeStep;

        return (
            <Step.Group widths={3}>
                <Step id="Allowance" active={activeStep === 'Allowance'} onClick={this.changeStep}>
                    <Icon name="pencil" />
                    <Step.Content>
                        <Step.Title>Allowances</Step.Title>
                        <Step.Description>Set Allowances for tokens you'd like to trade</Step.Description>
                    </Step.Content>
                </Step>
                <Step id="Trade" active={activeStep === 'Trade'} onClick={this.changeStep}>
                    <Icon name="exchange" />
                    <Step.Content>
                        <Step.Title>Trade</Step.Title>
                        <Step.Description>Exchange Tokens at a given rate</Step.Description>
                    </Step.Content>
                </Step>
                <Step id="ConfirmTransaction" active={activeStep === 'ConfirmTransaction'} onClick={this.changeStep}>
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
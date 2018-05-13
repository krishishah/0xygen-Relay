import * as React from 'react';
import { Button, Dropdown, Menu, Step, Icon, StepProps } from 'semantic-ui-react';

export type SimpleTakerTradeStep = 'Trade' | 'Allowance' | 'ConfirmTransaction';

interface Props {
    activeStep: SimpleTakerTradeStep;
    changeStep: (newStep: SimpleTakerTradeStep) => Promise<void>;
}

export class SimpleTakerTradeStepsHeader extends React.Component<Props> {

    constructor(props: Props) {
        super(props);
    }

    changeStep = async (event: React.MouseEvent<HTMLAnchorElement>, data: StepProps) => {
        await this.props.changeStep(data.id);
    }

    render() {
        const activeStep = this.props.activeStep;

        return (
            <Step.Group widths={3} style={{overflow: 'visible'}}>
                <Step id="Allowance" active={activeStep === 'Allowance'} onClick={this.changeStep}>
                    <Icon name="pencil" />
                    <Step.Content>
                        <Step.Title>Allowances</Step.Title>
                        <Step.Description>Set allowances for tokens you'd like to trade</Step.Description>
                    </Step.Content>
                </Step>
                <Step id="Trade" active={activeStep === 'Trade'} onClick={this.changeStep}>
                    <Icon name="exchange" />
                    <Step.Content>
                        <Step.Title>Trade</Step.Title>
                        <Step.Description>Exchange tokens at a given rate</Step.Description>
                    </Step.Content>
                </Step>
                <Step id="ConfirmTransaction" active={activeStep === 'ConfirmTransaction'} onClick={this.changeStep}>
                    <Icon name="check circle" />
                    <Step.Content>
                        <Step.Title>Confirm Transaction</Step.Title>
                        <Step.Description>Transaction receipt</Step.Description>
                    </Step.Content>
                </Step>
            </Step.Group>
        );
    }
}
import * as React from 'react';
import { Button, Dropdown, Menu, Step, Icon, StepProps } from 'semantic-ui-react';

export type SimpleMakerTradeStep = 'CreateOrder' | 'Allowance' | 'SubmitOrder';

interface Props {
    activeStep: SimpleMakerTradeStep;
    changeStep: (newStep: SimpleMakerTradeStep) => Promise<void>;
}

export class SimpleMakerTradeStepsHeader extends React.Component<Props> {

    constructor(props: Props) {
        super(props);
    }

    changeStep = async (event: React.MouseEvent<HTMLAnchorElement>, data: StepProps) => {
        await this.props.changeStep(data.id);
    }

    render() {
        const activeStep = this.props.activeStep;

        return (
            <Step.Group widths={3}>
                <Step id="Allowance" active={activeStep === 'Allowance'} onClick={this.changeStep}>
                    <Icon name="pencil" />
                    <Step.Content>
                        <Step.Title>Allowances</Step.Title>
                        <Step.Description>Set allowances for tokens you'd like to trade</Step.Description>
                    </Step.Content>
                </Step>
                <Step id="CreateOrder" active={activeStep === 'CreateOrder'} onClick={this.changeStep}>
                    <Icon name="edit" />
                    <Step.Content>
                        <Step.Title>Create Order</Step.Title>
                        <Step.Description>Create and sign order using your cryptographic signature</Step.Description>
                    </Step.Content>
                </Step>
                <Step id="ConfirmTransaction" active={activeStep === 'SubmitOrder'} onClick={this.changeStep}>
                    <Icon name="check circle" />
                    <Step.Content>
                        <Step.Title>Submit Order</Step.Title>
                        <Step.Description>Order confirmation</Step.Description>
                    </Step.Content>
                </Step>
            </Step.Group>
        );
    }
}
import * as React from 'react';
import { Button, Dropdown, Menu, Step, Icon, StepProps } from 'semantic-ui-react';
import { UserSettlementWorkflow } from '../../containers/App';

export type SimpleMakerTradeStep = 'CreateOrder' | 'Allowance' | 'SubmitOrder';

interface Props {
    activeStep: SimpleMakerTradeStep;
    changeStep: (newStep: SimpleMakerTradeStep) => Promise<void>;
    isSubmitOrderDisabled: boolean;
    userSettlementWorkflow: UserSettlementWorkflow;
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
        const workflow = this.props.userSettlementWorkflow;

        // Temporary - TODO: Deal with this better later
        const allowanceTitle = workflow === 'On-Chain' ? 'Allowances' : 'Deposit';
        const allowanceMessage = workflow === 'On-Chain' ? 
                'Set allowances for tokens you\'d like to trade'
            :
                'Deposit your tokens into an escrow smart contract';

        return (
            <Step.Group widths={3} style={{overflow: 'visible'}} attached="top">
                <Step id="Allowance" active={activeStep === 'Allowance'} onClick={this.changeStep}>
                    <Icon name="pencil" />
                    <Step.Content>
                        <Step.Title>{allowanceTitle}</Step.Title>
                        <Step.Description>{allowanceMessage}</Step.Description>
                    </Step.Content>
                </Step>
                <Step id="CreateOrder" active={activeStep === 'CreateOrder'} onClick={this.changeStep}>
                    <Icon name="edit" />
                    <Step.Content>
                        <Step.Title>Create Order</Step.Title>
                        <Step.Description>Create and sign order using your cryptographic signature</Step.Description>
                    </Step.Content>
                </Step>
                <Step 
                    disabled={this.props.isSubmitOrderDisabled} 
                    id="SubmitOrder" 
                    active={activeStep === 'SubmitOrder'} 
                    onClick={this.changeStep}
                >
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
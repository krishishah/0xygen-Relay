import * as React from 'react';
import { Button, Grid, ButtonProps } from 'semantic-ui-react';
import { UserSettlementWorkflow } from '../../containers/App';

interface Props {
    activeSettlementWorkflow: UserSettlementWorkflow;
    onClickOnChainWorkflow: (event: React.MouseEvent<HTMLButtonElement>, data: ButtonProps) => Promise<void>;
    onClickOffChainWorkflow: (event: React.MouseEvent<HTMLButtonElement>, data: ButtonProps) => Promise<void>;
}

export default class SettlementWorkflowButtonGroup extends React.Component<Props> {

    constructor(props: Props) {
        super(props);
    }

    render() {
        return (
            <Grid 
                centered
                style={{ 
                    padding: '2em 1em 2em 1em', 
                    marginTop: '0px !important', 
                    marginLeft: 'auto', 
                    marginRight: 'auto',
                    marginBottom: 'auto'
                }}
            >
                <Button.Group size="large">
                    <Button 
                        basic={this.props.activeSettlementWorkflow !== 'On-Chain'} 
                        onClick={this.props.onClickOnChainWorkflow}
                        color="grey" 
                    >
                    On-Chain
                    </Button>
                    <Button 
                        basic={this.props.activeSettlementWorkflow !== 'Off-Chain'} 
                        onClick={this.props.onClickOffChainWorkflow}
                        color="grey" 
                    >
                    Off-Chain
                    </Button>
                </Button.Group>
            </Grid>
        );
    }
}
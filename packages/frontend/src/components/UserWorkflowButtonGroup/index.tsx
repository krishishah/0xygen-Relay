import * as React from 'react';
import { Button, Grid, ButtonProps } from 'semantic-ui-react';
import { UserSettlementWorkflow } from '../../containers/App';
import { UserWorflow } from '../Dashboard';

interface Props {
    activeUserWorkflow: UserWorflow;
    onChangeWorkflow: (event: React.MouseEvent<HTMLButtonElement>, data: ButtonProps) => void;
}

export default class UserWorkflowSettlementGroup extends React.Component<Props> {

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
                        name="Order Taker"  
                        basic={this.props.activeUserWorkflow !== 'Taker'} 
                        onClick={this.props.onChangeWorkflow}
                        color="grey" 
                    >
                    Order Taker
                    </Button>
                    <Button
                        name="Order Maker" 
                        basic={this.props.activeUserWorkflow !== 'Maker'} 
                        onClick={this.props.onChangeWorkflow}
                        color="grey" 
                    >
                    Order Maker
                    </Button>
                </Button.Group>
            </Grid>
        );
    }
}
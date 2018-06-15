import * as React from 'react';
import { Button, ModalHeaderProps, List, Modal, Header, Image, ButtonProps, Icon, Divider } from 'semantic-ui-react';
import { UserSettlementWorkflow } from '../../containers/App';
import SettlementWorkflowButtonGroup from '../SettlementWorkflowButtonGroup';
import UserWorkflowButtonGroup from '../UserWorkflowButtonGroup';
import { UserWorflow } from '../Dashboard';

interface Props {
    activeUserWorkflow: UserWorflow;
    onChangeUserWorkflow: (event: React.MouseEvent<HTMLButtonElement>, data: ButtonProps) => void;
    activeSettlementWorkflow: UserSettlementWorkflow;
    displayWorkflowInformationModal: boolean;
    onCloseWorkflowInformationModal: () => Promise<void>;
    onClickOnChainWorkflow: (event: React.MouseEvent<HTMLButtonElement>, data: ButtonProps) => Promise<void>;
    onClickOffChainWorkflow: (event: React.MouseEvent<HTMLButtonElement>, data: ButtonProps) => Promise<void>;
}

const inlineStyle = {
    modal : {
      marginTop: '0px !important',
      marginLeft: 'auto',
      marginRight: 'auto'
    }
};

export default class WorkflowChoiceModal extends React.Component<Props> {

    constructor(props: Props) {
        super(props);
    }

    render() {
        return (
            <Modal
                open={this.props.displayWorkflowInformationModal}
                closeIcon={true}
                onClose={this.props.onCloseWorkflowInformationModal}
                size="large"
                centered={true}
                dimmer="blurring"
                style={inlineStyle.modal}
            >
                <Header icon="lab" content="0XYGEN DEX" textAlign="center"/>
                <Modal.Content scrolling>
                    <Modal.Description>
                        <Header content="Choose Your Trading Workflow" textAlign="center" as="h2"/>
                        <Image centered size="medium" src="/images/makerTaker0xygenDiagram.png" />
                        <List>
                            <List.Item>
                                <List.Header>
                                    1. The order maker specifies the terms of 
                                    trade and submits a signed order to the exchange
                                </List.Header>
                            </List.Item>
                            <List.Item>
                                <List.Header>
                                    2. The exchange broadcasts the newly submitted order to prospective order takers
                                </List.Header>
                            </List.Item>
                            <List.Item>
                                <List.Header>
                                3. An order taker submits the signed order to the network for execution
                                </List.Header>
                            </List.Item>
                        </List>
                        <UserWorkflowButtonGroup
                            activeUserWorkflow={this.props.activeUserWorkflow}
                            onChangeWorkflow={this.props.onChangeUserWorkflow}
                        />
                        <Divider />
                        <Header content="Choose Your Settlement Type" textAlign="center" as="h2"/>
                        <List>
                            <List.Item>
                                <List.Header>
                                    Off-Chain Settlement:
                                </List.Header>
                                A simulation of the trading experience one would experience if
                                they traded using an Off-Chain Payment Network. Please note that Off-Chain Settlement 
                                is a simulation and does not trade Network Tokens.
                            </List.Item>
                            <List.Item>
                                <List.Header>
                                    On-Chain Settlement: 
                                </List.Header>
                                Users must be on the Kovan Test Network to take advantage of On-Chain trading.
                            </List.Item>
                        </List>
                        <SettlementWorkflowButtonGroup
                            onClickOnChainWorkflow={this.props.onClickOnChainWorkflow}
                            onClickOffChainWorkflow={this.props.onClickOffChainWorkflow}
                            activeSettlementWorkflow={this.props.activeSettlementWorkflow}
                        />
                    </Modal.Description>
                </Modal.Content>
                <Modal.Actions>
                    <Button color="green" onClick={this.props.onCloseWorkflowInformationModal} inverted>
                    <Icon name="checkmark" /> Got it
                    </Button>
                </Modal.Actions>
            </Modal>
        );
    }
}
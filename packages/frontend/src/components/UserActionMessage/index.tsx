import * as React from 'react';
import { Message, Icon } from 'semantic-ui-react';

export type UserActionMessageStatus = 'LOADING' | 'SUCCESS' | 'FAILURE' | 'TRADE_SUCCESS' |'NONE';

export interface UserActionMessageProps {
    status: UserActionMessageStatus;
    message?: string;
    dismissMessage: () => void;
}

export class UserActionMessage extends React.Component<UserActionMessageProps> {

    constructor(props: UserActionMessageProps) {
        super(props);
    }

    render() {
        const message = this.props.message || '';

        switch (this.props.status) {
            case 'LOADING': 
                return (
                    <Message icon attached="top" onDismiss={this.props.dismissMessage}>
                        <Icon name="circle notched" loading />
                        <Message.Content>
                            <Message.Header>Just a second</Message.Header>
                            We are processing the transaction
                        </Message.Content>
                    </Message>
                );
            case 'TRADE_SUCCESS':
                return (
                    <Message success attached="top" onDismiss={this.props.dismissMessage}>
                        <Message.Content>
                            <Message.Header>Trade Successful!</Message.Header>
                            Transaction Receipt: 
                            <a href={`https://kovan.etherscan.io/tx/${message}`}>
                                https://kovan.etherscan.io/tx/${message}
                            </a>
                        </Message.Content>
                    </Message>
                );
            case 'FAILURE':
                return (
                    <Message negative attached="top" onDismiss={this.props.dismissMessage}>
                        <Message.Content>
                            <Message.Header>Oops! Something went wrong.</Message.Header>
                            {message}
                        </Message.Content>
                    </Message>
                );
            case 'SUCCESS':
            return (
                <Message success attached="top" onDismiss={this.props.dismissMessage}>
                    <Message.Content>
                        <Message.Header>Success!</Message.Header>
                        {message}
                    </Message.Content>
                </Message>
            );
            default:
                return null;
                
        }
    }
}
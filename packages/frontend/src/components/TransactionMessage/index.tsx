import * as React from 'react';
import { Message, Icon } from 'semantic-ui-react';

export type TransactionMessageStatus = 'LOADING' | 'SUCCESS' | 'FAILURE' | 'NONE';

export interface TransactionMessageProps {
    status: TransactionMessageStatus;
    message?: string;
    dismissMessage: () => void;
}

export class TransactionMessage extends React.Component<TransactionMessageProps> {

    constructor(props: TransactionMessageProps) {
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
            case 'SUCCESS':
                return (
                    <Message success attached="top" onDismiss={this.props.dismissMessage}>
                        <Message.Content>
                            <Message.Header>Success!</Message.Header>
                            {message}
                        </Message.Content>
                    </Message>
                );
            case 'FAILURE':
                return (
                    <Message negative attached="top" onDismiss={this.props.dismissMessage}>
                        <Message.Content>
                            <Message.Header>Oops something went wrong</Message.Header>
                            {message}
                        </Message.Content>
                    </Message>
                );
            default:
                return null;
                
        }
    }
}
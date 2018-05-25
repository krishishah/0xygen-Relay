import * as React from 'react';
import { SignedOrder, ZeroEx } from '0x.js';
import { Button, Form, ButtonProps, Segment } from 'semantic-ui-react';
import { UserActionMessageStatus } from '../../../../components/UserActionMessage';
import { RelayerRestfulClient } from '../../../../api/orderbook/zeroEx/rest';

interface Props {
    signedOrder: SignedOrder | undefined;
    setTransactionMessageState: (status: UserActionMessageStatus, message?: string) => void;
}

interface State {

}

export default class SubmitSignedOrder extends React.Component<Props, State> {

    relayerRestfulClient: RelayerRestfulClient | null;

    constructor(props: Props) {
        super(props);
    }
    
    onClickSubmit = async (event: React.MouseEvent<HTMLButtonElement>, data: ButtonProps) => {
        if (this.relayerRestfulClient && this.props.signedOrder) {
            this.props.setTransactionMessageState(
                'LOADING', 
                'Thank you for waiting. Your order is currently being submitted.'
            );
            const success = await this.relayerRestfulClient.postSignedOrder(this.props.signedOrder);
            if (success) {
                this.props.setTransactionMessageState(
                    'SUCCESS', 
                    'Your order has been enlisted on the orderbook!'
                );
            } else {
                this.props.setTransactionMessageState(
                    'FAILURE', 
                    'Sorry, your order cannot be enlisted at the moment. Please try again later.'
                );
            }
        }

        // data.active = false;
    }

    render() {
        if (this.props.signedOrder !== undefined) {
            const orderHash = ZeroEx.getOrderHashHex(this.props.signedOrder);

            return(
                <Form style={{ height: '100%' }}>
                    <RelayerRestfulClient ref={ref => (this.relayerRestfulClient = ref)} />
                    <Form.Field>
                        <label>Signed Order:</label>
                        <Form.TextArea 
                            autoHeight 
                            style={{ fontFamily: 'monospace', whiteSpace: 'pre'}}
                        >
                            {JSON.stringify(this.props.signedOrder, null, 2)}
                        </Form.TextArea>
                    </Form.Field>
                    <Form.Field>
                        <label>Order Hash:</label>
                        <Form.TextArea autoHeight style={{ fontFamily: 'monospace', monospace: 'true'}}>
                            {orderHash}
                        </Form.TextArea>
                    </Form.Field>
                    <div style={{margin: '1em', display: 'flex', justifyContent: 'center'}}>
                        <Form.Button onClick={this.onClickSubmit}>
                            Submit Order
                        </Form.Button>
                    </div>
                </Form>
            );
        } else {
            return null;
        }
    }
}
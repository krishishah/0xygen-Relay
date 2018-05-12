import * as React from 'react';
import { SignedOrder } from '0x.js';
import { Button, Form, ButtonProps } from 'semantic-ui-react';
import { UserActionMessageStatus } from '../../../../components/UserActionMessage';

interface Props {
    signedOrder: SignedOrder | undefined;
    setTransactionMessageState: (status: UserActionMessageStatus, message?: string) => void;
}

interface State {

}

export default class SubmitSignedOrder extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
    }
    
    onClickSubmit = async (event: React.MouseEvent<HTMLButtonElement>, data: ButtonProps) => { }

    render() {
        return(
            <Form style={{ height: '100%' }}>
                <div><pre>{JSON.stringify(this.props.signedOrder, null, 2)}</pre></div>
                <div style={{margin: '1em', display: 'flex', justifyContent: 'center'}}>
                    <Form.Button onClick={this.onClickSubmit}>
                        Submit Order
                    </Form.Button>
                </div>
            </Form>
        );
    }
}
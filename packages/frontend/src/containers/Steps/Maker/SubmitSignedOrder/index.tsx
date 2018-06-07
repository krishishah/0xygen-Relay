import * as React from 'react';
import { SignedOrder, ZeroEx } from '0x.js';
import { Button, Form, ButtonProps, Segment } from 'semantic-ui-react';
import { UserActionMessageStatus } from '../../../../components/UserActionMessage';
import { ZeroExRelayerRestfulClient } from '../../../../api/orderbook/zeroEx/rest';
import { OffChainSignedOrder } from '../../../../types';
import { UserSettlementWorkflow } from '../../../App';
import { OffChainRelayerRestfulClient } from '../../../../api/orderbook/offChain/rest';
import { Utils } from '../../../../utils';

interface Props {
    zeroExSignedOrder: SignedOrder | undefined;
    offChainSignedOrder: OffChainSignedOrder | undefined;
    activeSettlementWorkflow: UserSettlementWorkflow;
    setTransactionMessageState: (status: UserActionMessageStatus, message?: string) => void;
}

interface State {

}

export default class SubmitSignedOrder extends React.Component<Props, State> {

    zeroExClient: ZeroExRelayerRestfulClient | null;
    offChainClient: OffChainRelayerRestfulClient | null;

    constructor(props: Props) {
        super(props);
    }
    
    onClickSubmit = async (event: React.MouseEvent<HTMLButtonElement>, data: ButtonProps) => {
        const activeWorkflow = this.props.activeSettlementWorkflow;
        const zeroExOrder = this.props.zeroExSignedOrder;
        const offChainOrder = this.props.offChainSignedOrder;

        if ((this.zeroExClient && zeroExOrder && activeWorkflow === 'On-Chain') || 
            (this.offChainClient && offChainOrder && activeWorkflow === 'Off-Chain')
        ) {
            this.props.setTransactionMessageState(
                'LOADING', 
                'Thank you for waiting. Your order is currently being submitted.'
            );

            let success: boolean = false;

            // Explicit conditions need to be repeated due to restrictions in typescript
            if (this.zeroExClient 
                && this.props.zeroExSignedOrder 
                && activeWorkflow === 'On-Chain'
            ) {
                success = await this.zeroExClient.postSignedOrder(this.props.zeroExSignedOrder);
            } else if (
                this.offChainClient 
                && this.props.offChainSignedOrder 
                && activeWorkflow === 'Off-Chain'
            ) {
                success = await this.offChainClient.postSignedOrder(this.props.offChainSignedOrder);
            }

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
    }

    render() {
        const activeWorkflow = this.props.activeSettlementWorkflow;

        if ((this.props.zeroExSignedOrder !== undefined && activeWorkflow === 'On-Chain') ||
            (this.props.offChainSignedOrder !== undefined && activeWorkflow === 'Off-Chain')) {
            
            let orderHash;

            // Explicit conditions need to be repeated due to restrictions in typescript
            if (this.props.zeroExSignedOrder !== undefined && activeWorkflow === 'On-Chain') {
                orderHash = ZeroEx.getOrderHashHex(this.props.zeroExSignedOrder);
            } else if (this.props.offChainSignedOrder !== undefined && activeWorkflow === 'Off-Chain') {
                orderHash = Utils.GetOffChainOrderHashHex(this.props.offChainSignedOrder);
            }

            return(
                <Form style={{ height: '100%' }}>
                    <ZeroExRelayerRestfulClient ref={ref => (this.zeroExClient = ref)} />
                    <OffChainRelayerRestfulClient ref={ref => (this.offChainClient = ref)} />
                    <Form.Field>
                        <label>Signed Order:</label>
                        <Form.TextArea 
                            autoHeight 
                            style={{ fontFamily: 'monospace', whiteSpace: 'pre'}}
                            value={
                                activeWorkflow === 'On-Chain' ? JSON.stringify(this.props.zeroExSignedOrder, null, 2)
                                : JSON.stringify(this.props.offChainSignedOrder, null, 2)
                                }
                        />
                    </Form.Field>
                    <Form.Field>
                        <label>Order Hash:</label>
                        <Form.TextArea 
                            autoHeight 
                            style={{ fontFamily: 'monospace', monospace: 'true'}} 
                            value={orderHash}
                        />
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
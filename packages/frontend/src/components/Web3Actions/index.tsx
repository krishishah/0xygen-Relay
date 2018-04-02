import * as React from 'react';
import { promisify } from '@0xproject/utils';
interface Props {
    web3: any;
}

export default class Web3Actions extends React.Component<Props, {}> {
    constructor(props: Props) {
        super(props);
    }
    render() {
        const msg = '0x.js sandbox!';
        const signMessage = async () => {
            const accounts = await promisify<string>(this.props.web3.eth.getAccounts)();
            try {
                const signData = await promisify<string>(this.props.web3.eth.sign)(accounts[0], msg);
                console.log(signData);
            } catch (e) {
                console.log(e);
            }
        };
        return (
            <div>
                <h2>Additional Web3 Actions</h2>
                <p> These are examples of other web3 actions you may come across when creating your dApp </p>
                <button id="personalSignButton" onClick={signMessage}>
                    Sign Message
                </button>
            </div>
        );
    }
}

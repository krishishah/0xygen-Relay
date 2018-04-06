// import * as React from 'react';
// import { ZeroEx, SignedOrder } from '0x.js';
// import { relayerResponseJsonParsers } from '@0xproject/connect/lib/src/utils/relayer_response_json_parsers';
// import { Button, Divider, Container } from 'semantic-ui-react';

// interface Props {
//     zeroEx: ZeroEx;
// }

// export default class SetAllowances extends React.Component<Props> {
//     constructor(props: Props) {
//         super(props);
//     }
//     private async dispenseZRX(): Promise<void> {
//         const addresses = await this.props.zeroEx.getAvailableAddressesAsync();
//         const address = addresses[0];
//         const url = `https://faucet.0xproject.com/zrx/${address}`;
//         await fetch(url);
//     }
//     private async dispenseETH(): Promise<void> {
//         const addresses = await this.props.zeroEx.getAvailableAddressesAsync();
//         const address = addresses[0];
//         const url = `https://faucet.0xproject.com/ether/${address}`;
//         await fetch(url);
//     }
//     private async orderWETH(): Promise<void> {
//         const addresses = await this.props.zeroEx.getAvailableAddressesAsync();
//         const address = addresses[0];
//         const url = `https://faucet.0xproject.com/order/weth/${address}`;
//         const response = await fetch(url);
//         const bodyJson = await response.json();

//         const signedOrder: SignedOrder = relayerResponseJsonParsers.parseOrderJson(bodyJson);
//         console.log(signedOrder);

//         const fillAmount = ZeroEx.toBaseUnitAmount(signedOrder.takerTokenAmount, 18);
//         try {
//             await this.props.zeroEx.exchange.fillOrderAsync(signedOrder, fillAmount, true, address);
//         } catch (e) {
//             console.log(e);
//         }
//     }
//     // tslint:disable-next-line:member-ordering
//     render() {
//         return (
//             <Container textAlign="center">

//             </Container>
//         );
//     }
// }

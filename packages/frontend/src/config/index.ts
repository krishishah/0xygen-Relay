// Kovan is a test network
// Please ensure you have Metamask installed
// and it is connected to the Kovan test network
export const KOVAN_NETWORK_ID = 42;
export const KOVAN_RPC = 'https://kovan.infura.io/WJFq23sRIxeu7Snltrjq';

export const TEST_RPC_NETWORK_ID = 50;
export const TEST_RPC = 'http://localhost:8545';

export const ETHER_TOKEN_SYMBOL = 'ETH';
export const ETHER_DECIMAL_PLACES = 18;

export const RELAYER_HOST = process.env.RELAYER_HOST || 'http://localhost:3000';

export const RELAYER_ZERO_EX_WS_URL = process.env.RELAYER_ZERO_EX_WS_URL || 'ws://localhost:3001';
export const RELAYER_OFF_CHAIN_WS_URL = process.env.RELAYER_OFF_CHAIN_WS_URL || 'ws://localhost:3002';

export const PAYMENT_NETWORK_HTTP_URL = process.env.PAYMENT_NETWORK_HTTP_URL || 'http://localhost:3003';
export const PAYMENT_NETWORK_WS_URL = process.env.PAYMENT_NETWORK_WS_URL || 'ws://localhost:3004';
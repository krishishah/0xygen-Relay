import axios, { AxiosRequestConfig, AxiosPromise, AxiosResponse, AxiosError } from 'axios';
import * as jwt from 'jsonwebtoken';
import Web3 from 'web3';
import base64url from 'base64url';
import * as fs from 'fs';

const LIQUIDITY_NETWORK_HOST: string = 'https://wallet.liquidity.network/';

const privateKey = fs.readFileSync(__dirname + '../../../ecdsa-p521-private.pem');
const publicKey = fs.readFileSync(__dirname + '../../../ecdsa-p521-public.pem');

const provider = new Web3.providers.HttpProvider('http://localhost:8545');
var web3 = new Web3(provider);

export interface AccountTokenRequest {
    username: string;
    password: string;
}

export interface AccountIdPublicKeyUserTriple {
    id: number;
    public_key: string;
    user: number;
}

export interface AcountTokenResponse {
    accountPublicKeyMappings: AccountIdPublicKeyUserTriple[];
}

//////////////////////////////// STEP 1: REGISTER /////////////////////////////////////////////////////

const LIQUIDITY_REGISTER_ACCOUNT_URI = '/account/register';

export interface RegisterAccountRequest {
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    password: string;
}

export interface RegisterAccountResponse {
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    id: number;
}

const registerAccount = (registerAccountRequest: RegisterAccountRequest): Promise<RegisterAccountResponse> => {
    return axios.post(`${LIQUIDITY_NETWORK_HOST}${LIQUIDITY_REGISTER_ACCOUNT_URI}`, registerAccountRequest)
        .then((value: AxiosResponse<RegisterAccountResponse>) => {
            return value.data;
        }
    );
};

//////////////////////////////// ADD TOKEN /////////////////////////////////////////////////////

const LIQUIDITY_ADD_TOKEN_URI = '/account/register';

export interface AddTokenRequest {
    username: string;
    password: string;
    public_key: string;
}

export type AddTokenResponse = AccountIdPublicKeyUserTriple;

const addToken = (addTokenRequest: AddTokenRequest): Promise<AddTokenResponse> => {
    return axios.post(`${LIQUIDITY_NETWORK_HOST}${LIQUIDITY_ADD_TOKEN_URI}`, addTokenRequest)
        .then((value: AxiosResponse<AddTokenResponse>) => {
            return value.data;
        }
    );
};

//////////////////////////////// AUTHENTICATION ////////////////////////////////////////

export interface TokenHeader {
    alg: string;
    typ: string;
}

export interface TokenPayload {
    key_id: number;
    exp: number;
}

const LIQUIDITY_TOKEN_HEADER: TokenHeader = {
    alg: 'ES512',
    typ: 'JWT'
};

const encodeObj = (obj: Object): string => {
    const jsonObj = JSON.stringify(obj);
    return base64url.encode(Buffer.from(jsonObj));
};

const signObj = (tokenPayload: TokenPayload): string => {
    return jwt.sign(tokenPayload, privateKey, { algorithm: 'ES512'});
};

const generateJwt = (header: string, payload: string, signature: string): string => {
    return `${header}.${payload}.${signature}`;
};

//////////////////////////////// STEP 3: MERCHANT /////////////////////////////////////////////////////

const LIQUIDITY_MERCHANT_URI = '/merchant';

export interface MerchantRequest {
    email: string;
    name: string;
    address1: string;
    zipcode: string;
    city: string;
    country: string;
    phone_number1: string;
}

export interface MerchantResponse extends MerchantRequest {
    id: number;
    user: number;
    address2: string;
    address3: string;
    phone_number2: string;
    subscribed_at: string;
    confirmed: string;
}

const addMerchantInformation = (merchantInfo: MerchantRequest, jsonWebToken: string): Promise<MerchantResponse> => {
    const config: AxiosRequestConfig = {
        headers: {
            'Authorization': 'Bearer ' + jsonWebToken
        }
    };

    const merchantJson: string = JSON.stringify(merchantInfo);

    return axios.post(`${LIQUIDITY_NETWORK_HOST}${LIQUIDITY_MERCHANT_URI}`, merchantJson, config)
        .then((value: AxiosResponse<MerchantResponse>) => {
            return value.data;
        }
    );
};

//////////////////////////////// CREATE PAYMENT /////////////////////////////////////////////////////

const LIQUIDITY_PAYMENT_URI = '/payment';

export interface CreatePaymentRequest {
    merchant_wallet: number;
    note_to_receiver: string;
    payer_address: string;
    receiver_address: string;
    amount: string;
    currency: string;
    invoice_number: string;
    purchase_order_number: string;
    description: string;
    custom_field: string;
}

export interface CreatePaymentResponse extends CreatePaymentRequest {
    id: number;
    uuid: string;
    note_to_payer: string;
    created_at: string;
    received_at: string;
}

const createPayment = (paymentReq: CreatePaymentRequest, jsonWebToken: string): Promise<CreatePaymentResponse> => {
    const config: AxiosRequestConfig = {
        headers: {
            'Authorization': 'Bearer ' + jsonWebToken
        }
    };

    const paymentReqJson: string = JSON.stringify(paymentReq);

    return axios.post(`${LIQUIDITY_NETWORK_HOST}${LIQUIDITY_PAYMENT_URI}`, paymentReqJson, config)
        .then((value: AxiosResponse<CreatePaymentResponse>) => {
            return value.data;
        }
    );
};

//////////////////////////////// AUTHORISE PAYMENT /////////////////////////////////////////////////////

const LIQUIDITY_AUTHORISE_PAYMENT_URI = (uuid: string) => `/payment/authorize/${uuid}`;

export interface AuthorisePaymentRequest {
    authorization_nonce: number;
    authorization_round: number;
    authorization: string;
    balance_authorization: string;
}

export interface AuthorisePaymentResponse {

}

const authorisePayment = (uuid: string, authReq: AuthorisePaymentRequest): Promise<string> => {

    const authReqJson: string = JSON.stringify(authReq);

    return axios.post(`${LIQUIDITY_NETWORK_HOST}${LIQUIDITY_AUTHORISE_PAYMENT_URI(uuid)}`, authReqJson)
        .then((value: AxiosResponse) => {
            return value.statusText;
        }
    );
};

////////////////////////////////////// EXECUTE PAYMENT /////////////////////////////////////////////////////

const LIQUIDITY_EXECUTE_AUTORISED_PAYMENT_URI = (uuid: string) => `/payment/execute/${uuid}`;

export interface ExecutePaymentRequest {
    receipt: string;
}

export interface ExecutePaymentResponse {

}

const executePayment = (uuid: string, executeReq: ExecutePaymentRequest): Promise<string> => {

    const execReqJson: string = JSON.stringify(executeReq);

    return axios.post(`${LIQUIDITY_NETWORK_HOST}${LIQUIDITY_EXECUTE_AUTORISED_PAYMENT_URI(uuid)}`, execReqJson)
        .then((value: AxiosResponse) => {
            return value.statusText;
        }
    );
};
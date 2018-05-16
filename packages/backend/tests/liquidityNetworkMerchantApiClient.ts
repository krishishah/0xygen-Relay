import axios, { AxiosRequestConfig, AxiosPromise, AxiosResponse, AxiosError } from 'axios';
import * as jwt from 'jsonwebtoken';
import Web3 from 'web3';
import base64url from 'base64url';

const LIQUIDITY_NETWORK_HOST: string = 'https://wallet.liquidity.network/';
const LIQUIDITY_CREATE_PAYMENT = '/payment';
const LIQUIDITY_AUTHORISE_PAYMENT_URI = (uuid: string) => `/payment/authorize/${uuid}`;
const LIQUIDITY_EXECUTE_AUTORISED_PAYMENT_URI = (uuid: string) => `/payment/execute/${uuid}`;

const provider = new Web3.providers.HttpProvider('http://localhost:8545');
var web3 = new Web3(provider);

export interface AccountTokenRequest {
    username: string;
    password: string;
}

export interface AccountIdPublicKeyUserTriple {
    id: string;
    public_key: string;
    user: string;
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
    id: string;
}

const registerAccount = (registerAccountRequest: RegisterAccountRequest): Promise<RegisterAccountResponse> => {
    return axios.post(`${LIQUIDITY_NETWORK_HOST}${LIQUIDITY_REGISTER_ACCOUNT_URI}`, registerAccountRequest)
        .then((value: AxiosResponse<RegisterAccountResponse>) => {
            return value.data;
        }
    );
};

/////////////////////////// AUTHENTICATION ////////////////////////////////////

export interface TokenHeader {
    alg: string;
    typ: string;
}

export interface TokenPayload {
    key_id: number;
    exp: number;
    scope: { };
}

const LIQUIDITY_TOKEN_HEADER: TokenHeader = {
    alg: 'ES256',
    typ: 'JWT'
};

const encodeObj = (obj: Object): string => {
    const jsonObj = JSON.stringify(obj);
    return base64url.encode(Buffer.from(jsonObj));
};

const signObj = (obj: string): string => {
    return web3.eth.sign(obj, web3.eth.accounts[0], (err, res) => {
        if (err) {
            // tslint:disable-next-line:no-console
            console.log(err);
        } else {
            return res;
        }
    });
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
    id: string;
    user: string;
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

//////////////////////////////// EXECUTE PAYMENT /////////////////////////////////////////////////////

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
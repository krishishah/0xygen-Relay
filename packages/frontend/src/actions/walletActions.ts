import * as React from 'react';
import * as _ from 'lodash';
import { ZeroEx, Token } from '0x.js';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as Web3 from 'web3';
import { BigNumber } from '@0xproject/utils';
import { Dispatch } from 'redux';
import { ThunkAction } from 'redux-thunk';

interface Props {
    web3: Web3;
    zeroEx: ZeroEx;
}

interface TokenBalance {
    token: Token;
    balance: BigNumber;
}



function fetchAccountDetailsAsync() {

    return (dispatch, getState) => {

    }
    // Get the Available Addresses from the Web3 Provider inside of ZeroEx
    const addresses = await this.props.zeroEx.getAvailableAddressesAsync();
    // Request all of the tokens and their details from the 0x Token Registry
    const tokens = await this.props.zeroEx.tokenRegistry.getTokensAsync();
    const address = addresses[0];
    if (!address) {
        return;
    }
    const balances = {};
    balances[address] = {};
    // Fetch all the Balances for all of the tokens in the Token Registry
    const allBalancesAsync = _.map(tokens, async (token: Token): Promise<TokenBalance> => {
        try {
            const balance = await this.props.zeroEx.token.getBalanceAsync(token.address, address);
            const numberBalance = new BigNumber(balance);
            return { token: token, balance: numberBalance };
        } catch (e) {
            console.log(e);
            return { token: token, balance: new BigNumber(0) };
        }
    });

    // Convert all of the Units into more Human Readable numbers
    // Many ERC20 tokens go to 18 decimal places
    const results = await Promise.all(allBalancesAsync);
    _.each(results, (tokenBalance: TokenBalance) => {
        if (tokenBalance.balance && tokenBalance.balance.gt(0)) {
            balances[address][tokenBalance.token.name] = ZeroEx.toUnitAmount(
                tokenBalance.balance,
                tokenBalance.token.decimals
            );
        }
    });

    // Fetch the Balance in Ether
    try {
        const ethBalance = await this._web3Wrapper.getBalanceInWeiAsync(address);
        if (ethBalance) {
            const ethBalanceNumber = new BigNumber(ethBalance);
            balances[address][ETHER_TOKEN_NAME] = ZeroEx.toUnitAmount(new BigNumber(ethBalanceNumber), 18);
        }
    } catch (e) {
        console.log(e);
    }

    // Update the state in React
    this.setState((prev, props) => {
        return { ...prev, balances: balances, accounts: addresses };
    });
};

export function itemsHasErrored(bool) {
    return {
        type: 'ITEMS_HAS_ERRORED',
        hasErrored: bool
    };
}

export function itemsIsLoading(bool) {
    return {
        type: 'ITEMS_IS_LOADING',
        isLoading: bool
    };
}

export function itemsFetchDataSuccess(items) {
    return {
        type: 'ITEMS_FETCH_DATA_SUCCESS',
        items
    };
}

export function fetchAccountDetails() {
    return (dispatch) => {
        dispatch(itemsIsLoading(true));

        fetch(url)
            .then((response) => {
                if (!response.ok) {
                    throw Error(response.statusText);
                }

                dispatch(itemsIsLoading(false));

                return response;
            })
            .then((response) => response.json())
            .then((items) => dispatch(itemsFetchDataSuccess(items)))
            .catch(() => dispatch(itemsHasErrored(true)));
    };
}



import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import logger from 'redux-logger';
import rootReducer from '../reducers';
import { Dictionary } from 'lodash';
import BigNumber from 'bignumber.js';

interface StoreState {
    accounts: Array<string>;
    balances: Dictionary<Dictionary<BigNumber>>;
    metamaskDetected: boolean; 
    metamaskUnlocked: boolean;    
}

export default function configureStore(initialState?: StoreState) {
    return createStore(
        rootReducer,
        initialState,
        applyMiddleware(thunk, logger())
    );
}
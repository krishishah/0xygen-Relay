import { combineReducers } from 'redux';
import {
  INSTANTIATE_0X,
  INSTANTIATE_WEB3
} from '../actions/appSetupActions';
import { Action } from 'redux';
import { Dictionary } from 'lodash';

function appSetup(state: Dictionary<string> = {}, action: Action) {
  switch (action.type) {
    case INSTANTIATE_0X:
      return {
        zeroEx: action.zeroEx,
      }
    default: 
      return state;
  }
}

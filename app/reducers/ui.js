import { combineReducers } from 'redux';
import * as types from '../constants/ActionTypes';

const hSplitSize = (state = 500, action) => {
  switch (action.type) {
    case types.SET_HORIZONTAL_SPLIT_SIZE:
      return action.size || state;
    default:
      return state;
  }
};

export default combineReducers({
  hSplitSize,
});

import { combineReducers } from 'redux';
import * as types from '../constants/ActionTypes';

const fileSizeFormat = (state = 'human', action) => {
  switch (action.type) {
    case types.SET_FILE_SIZE_FORMAT:
      return action.format;
    default:
      return state;
  }
};

export default combineReducers({
  fileSizeFormat,  // string, 'bytes' or 'human'
});

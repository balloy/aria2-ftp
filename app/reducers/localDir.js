import { combineReducers } from 'redux';
import * as types from '../constants/ActionTypes';

const dir = (state = '.', action) => {
  switch (action.type) {
    case types.LOCAL_DIR_LOAD_SUCCESS:
      return action.dir;
    default:
      return state;
  }
};

const errorMsg = (state = null, action) => {
  switch (action.type) {
    case types.LOCAL_DIR_LOAD_REQUEST:
    case types.LOCAL_DIR_LOAD_SUCCESS:
      return null;
    case types.LOCAL_DIR_LOAD_FAILURE:
      return action.errorMsg;
    default:
      return state;
  }
};

const isFetching = (state = false, action) => {
  switch (action.type) {
    case types.LOCAL_DIR_LOAD_REQUEST:
      return true;
    case types.LOCAL_DIR_LOAD_SUCCESS:
    case types.LOCAL_DIR_LOAD_FAILURE:
      return false;
    default:
      return state;
  }
};

const items = (state = [], action) => {
  switch (action.type) {
    case types.LOCAL_DIR_LOAD_SUCCESS:
      return action.items;
    default:
      return state;
  }
};

export default combineReducers({
  dir,        // current dir
  errorMsg,
  isFetching, // loading dir?
  items,      // array of sub files/dirs of current dir
});

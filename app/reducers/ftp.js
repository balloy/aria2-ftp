import { combineReducers } from 'redux';
import * as types from '../constants/ActionTypes';

const ftpClient = (state = null, action) => {
  switch (action.type) {
    case types.FTP_CONNECT_REQUEST:
    case types.FTP_CONNECT_FAILURE:
      return null;

    case types.FTP_CONNECT_SUCCESS:
      return action.ftpClient;
    default:
      return state;
  }
};

const address = (state = '', action) => {
  switch (action.type) {
    case types.FTP_CONNECT_SUCCESS:
      return action.address;
    default:
      return state;
  }
};

const dir = (state = '/', action) => {
  switch (action.type) {
    case types.FTP_DIR_LOAD_SUCCESS:
      return action.dir;
    default:
      return state;
  }
};

const errorMsg = (state = null, action) => {
  switch (action.type) {
    case types.FTP_CONNECT_REQUEST:
    case types.FTP_CONNECT_SUCCESS:
    case types.FTP_DIR_LOAD_REQUEST:
    case types.FTP_DIR_LOAD_SUCCESS:
      return null;
    case types.FTP_CONNECT_FAILURE:
    case types.FTP_DIR_LOAD_FAILURE:
      return action.errorMsg;
    default:
      return state;
  }
};

const isFetching = (state = false, action) => {
  switch (action.type) {
    case types.FTP_CONNECT_REQUEST:
    case types.FTP_DIR_LOAD_REQUEST:
      return true;
    case types.FTP_CONNECT_SUCCESS:
    case types.FTP_CONNECT_FAILURE:
    case types.FTP_DIR_LOAD_SUCCESS:
    case types.FTP_DIR_LOAD_FAILURE:
      return false;
    default:
      return state;
  }
};

const items = (state = [], action) => {
  switch (action.type) {
    case types.FTP_DIR_LOAD_SUCCESS:
      return action.items;
    case types.FTP_CONNECT_FAILURE:
    case types.FTP_DIR_LOAD_FAILURE:
      return [];
    default:
      return state;
  }
};

const selection = (state = [], action) => {
  switch (action.type) {
    case types.FTP_DIR_TOGGLE_SELECTION:
      if (state.includes(action.key)) {
        return state.filter(x => x !== action.key);
      }
      return [...state, action.key];

    case types.FTP_DIR_TOGGLE_ALL:
      return action.selectAll ? action.keys : [];
    case types.FTP_DIR_SET_SELECTION:
      return action.keys;

    case types.FTP_DIR_LOAD_SUCCESS:
    case types.FTP_DIR_LOAD_FAILURE:
      // reset to empty when current dir changed
      return [];
    default:
      return state;
  }
};

export default combineReducers({
  ftpClient,  // the object to perform ftp browsing
  address,    // current ftp site info: todo: rename to site, make it object
  dir,        // current dir
  errorMsg,
  isFetching, // currently communicating with ftp server?
  items,      // array of sub files/dirs of current dir
  selection,  // current selection, array of item names
});

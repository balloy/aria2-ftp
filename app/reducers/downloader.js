import { combineReducers } from 'redux';
import * as types from '../constants/ActionTypes';

const aria2Client = (state = null, action) => {
  switch (action.type) {
    case types.ARIA2C_START_REQUEST:
    case types.ARIA2C_START_FAILURE:
      return null;
    case types.ARIA2C_START_SUCCESS:
      return action.client;
    default:
      return state;
  }
};

const items = (state = [], action) => {
  switch (action.type) {
    case types.ADD_DOWNLOAD_ITEM:
      return [...state, action.item];
    case types.UPDATE_DOWNLOAD_ITEM:
      return state.map(x => ((x.gid === action.item.gid) ? action.item : x));
    case types.REMOVE_DOWNLOAD_ITEM:
      return state.filter(x => (x.gid !== action.item.gid));
    default:
      return state;
  }
};

export default combineReducers({
  aria2Client,  // the object to communicate with aria2
  items,        // array of download items
});

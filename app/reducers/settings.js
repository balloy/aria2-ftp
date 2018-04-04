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

const downloadSplit = (state = 5, action) => {
  switch (action.type) {
    case types.SET_DOWNLOAD_SPLIT:
      return action.split;
    default:
      return state;
  }
};

const localDir = (state = '.', action) => {
  switch (action.type) {
    case types.LOCAL_DIR_LOAD_SUCCESS:
      return action.dir;
    default:
      return state;
  }
};

export default combineReducers({
  fileSizeFormat,  // string, 'bytes' or 'human'
  downloadSplit,   // number, 1-16
  localDir,        // latest local dir, duplicate of state.localDir.dir to make it persistent
});

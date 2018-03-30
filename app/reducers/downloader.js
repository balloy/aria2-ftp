import * as types from '../constants/ActionTypes';
import { Downloader } from '../api/downloader';

const initState = new Downloader();

const downloader = (state = initState, action) => {
  switch (action.type) {
    case types.INIT_DOWNLOADER_REQUEST:
    case types.INIT_DOWNLOADER_FAILURE:
      return initState;
    case types.INIT_DOWNLOADER_SUCCESS:
      return action.downloader;
    default:
      return state;
  }
};

export default downloader;

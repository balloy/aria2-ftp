import * as types from '../constants/ActionTypes';

const downloadQueue = (state = [], action) => {
  switch (action.type) {
    case types.UPDATE_DOWNLOAD_QUEUE:
      return action.items;
    default:
      return state;
  }
};

export default downloadQueue;

import * as types from '../constants/ActionTypes';

export const setFileSizeFormat = format => ({
  type: types.SET_FILE_SIZE_FORMAT,
  format
});

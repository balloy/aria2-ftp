import { actions } from 'react-redux-form';
import * as types from '../constants/ActionTypes';
import * as api from '../api/localDir';
import notifications from '../utils/notifications';

export const loadLocalDir = inputDir => (dispatch, getState) => {
  dispatch(localDirLoadRequest());

  // Return a Promise to make it awaitable.
  // no reject scenario, if can't load the dir, simply revert it to current dir.
  return new Promise((resolve) => {
    api.readDir(inputDir)
      .then(({ dir, items }) => {
        dispatch(actions.change('localDirForm.dir', dir));
        dispatch(localDirLoadSuccess(dir, items));
        return resolve();
      })
      .catch(async () => {
        const msg = `Sorry, '${inputDir}' does not exist or cannot be accessed. Going back.`;
        dispatch(localDirLoadFailure(msg));
        notifications.warn(msg);

        // go back to current dir
        await dispatch(loadLocalDir(getState().localDir.dir));
        resolve();
      });
  });
};

// private actions
const localDirLoadRequest = () => ({
  type: types.LOCAL_DIR_LOAD_REQUEST
});

const localDirLoadSuccess = (dir, items) => ({
  type: types.LOCAL_DIR_LOAD_SUCCESS,
  dir,
  items
});

const localDirLoadFailure = errorMsg => ({
  type: types.LOCAL_DIR_LOAD_FAILURE,
  errorMsg
});

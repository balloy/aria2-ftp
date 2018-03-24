import { actions } from 'react-redux-form';
import * as types from '../constants/ActionTypes';
import * as api from '../api/ftp';
import notifications from '../utils/notifications';
import { buildFTPAddress, parseFTPAddress } from '../utils/ftpUrl';

export const connectFtp = address => (dispatch, getState) => {
  console.log('About to connect to FTP:', address);

  // Return a Promise to make it awaitable.
  return new Promise((resolve, reject) => {
    if (getState().ftp.ftpClient) {
      console.log('Close previous FTP connection.');
      api.disconnect(getState().ftp.ftpClient);
    }

    // Validate URL format
    const url = parseFTPAddress(address);
    if (!url) {
      return reject(); // invalid URL format
    }

    // update form UI
    const data = {
      host: url.hostname,
      user: url.username,
      password: url.password,
      port: url.port || 21,
    };
    dispatch(actions.change('ftpAddressForm', data));

    // connect to FTP
    dispatch(ftpConnectRequest());
    api.connect(address)
      .then(async (ftpClient) => {
        // once connected, list files under / automatically
        // can't use address directly because it might contain path
        // ${data} doesn't contain pathname
        const site = buildFTPAddress(data);
        await dispatch(ftpConnectSuccess(ftpClient, site));
        await dispatch(loadFtpDir(url.pathname));
        return resolve();
      })
      .catch((err) => {
        const msg = `Sorry, '${address}' cannot be accessed.`;
        dispatch(ftpConnectFailure(msg));
        notifications.error(msg, err, true);
        reject();
      });
  });
};

export const loadFtpDir = inputDir => (dispatch, getState) => {
  dispatch(ftpDirLoadRequest());
  console.log('loadFtpDir:', inputDir);

  // Return a Promise to make it awaitable.
  // no reject scenario, if can't load the dir, simply revert it to current dir.
  return new Promise((resolve) => {
    api.readDir(getState().ftp.ftpClient, inputDir)
      .then(({ dir, items }) => {
        dispatch(actions.change('ftpDirForm.dir', dir));
        dispatch(ftpDirLoadSuccess(dir, items));
        return resolve();
      })
      .catch(async () => {
        const msg = `Sorry, '${inputDir}' does not exist. Going back to root.`;
        dispatch(ftpDirLoadFailure(msg));
        notifications.warn(msg);

        // go back to root
        await dispatch(loadFtpDir('/'));
        resolve();
      });
  });
};

export const toggleSelection = key => ({
  type: types.FTP_DIR_TOGGLE_SELECTION,
  key
});

export const toggleAll = (selectAll, keys) => ({
  type: types.FTP_DIR_TOGGLE_ALL,
  selectAll,
  keys
});

export const setSelection = keys => ({
  type: types.FTP_DIR_SET_SELECTION,
  keys
});

// private actions
const ftpConnectRequest = () => ({
  type: types.FTP_CONNECT_REQUEST
});

const ftpConnectSuccess = (ftpClient, address) => ({
  type: types.FTP_CONNECT_SUCCESS,
  ftpClient,
  address
});

const ftpConnectFailure = errorMsg => ({
  type: types.FTP_CONNECT_FAILURE,
  errorMsg
});


const ftpDirLoadRequest = () => ({
  type: types.FTP_DIR_LOAD_REQUEST
});

const ftpDirLoadSuccess = (dir, items) => ({
  type: types.FTP_DIR_LOAD_SUCCESS,
  dir,
  items
});

const ftpDirLoadFailure = errorMsg => ({
  type: types.FTP_DIR_LOAD_FAILURE,
  errorMsg
});

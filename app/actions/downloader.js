import * as types from '../constants/ActionTypes';
import * as api from '../api/downloader';
import { loadLocalDir } from '../actions/localDir';
import { getDownloadSuggestions } from '../actions/app';
import { joinURL } from '../utils/ftpUrl';
import notifications from '../utils/notifications';
import messagebox from '../utils/messagebox';

const path = require('path');
const electron = require('electron');

export const startAria2 = () => async (dispatch) => {
  console.log('About to start Aria2 deamon');
  dispatch(aria2cStartRequest());
  return new Promise((resolve, reject) => {
    const onSuccess = (client) => {
      dispatch(aria2cStartSuccess(client));
      resolve();
    };
    const onError = (err) => {
      dispatch(aria2cStartFailure(err));

      // show fatal error and exit program.
      messagebox.alert('Fatal: can not start Arir2 deamon.', err, true)
        .ok(() => electron.remote.getCurrentWindow().close());
      reject();
    };
    api.startAria2(onSuccess, onError);
  });
};

export const startDownloads = (fileNames) => (dispatch, getState) => {
  const { localDir, ftp, downloader } = getState();
  const { aria2Client } = downloader;
  // todo: allow user specify split, currently use default setting in aria2.conf file
  // console.log(`startDownloads, split: ${split}, local dir: ${localDir.dir}`);
  console.log('startDownloads, local dir:', localDir.dir);

  // need to check suggestions
  const ftpItems = dispatch(getDownloadSuggestions());
  // convert arrays to map to speed up item looking up
  const suggestionMap = ftpItems.reduce((map, obj) => ({ ...map, [obj.name]: obj.suggestion }), {});

  // construct download URI list
  const urlBase = joinURL(ftp.address, ftp.dir);
  const uris = [];
  fileNames.forEach(name => {
    const suggestion = suggestionMap[name];
    console.log(`download suggestion for ${name}: ${suggestion}`);

    const url = joinURL(urlBase, name);
    if (suggestion === 'downloading') {
      // only keep the ones not already in download queue
      notifications.warn(`${name} is in download queue already.`);
    // } else if (suggestion === 'downloaded') {
    //   // todo: add confirm messagebox
    } else {
      uris.push(url);
    }
  });

  const onAdd = item => dispatch(addDownloadItem(item));
  api.startDownloads(aria2Client, uris, localDir.dir, onAdd, err => {
    notifications.error(
      `Failed to start downloading ${err.item.name}.`,
      `URL: to start downloading ${err.item.url}.`,
    );
  });
};

export const refreshDownloadsStatus = () => (dispatch, getState) => {
  const { aria2Client, items } = getState().downloader;
  const onUpdate = item => dispatch(updateDownloadItem(item));
  const onComplete = item => {
    notifications.info(
      `${item.name} has been downloaded successfully.`,
      `Full Path: ${path.join(item.localDir, item.name)}`,
      false, 5000
    );
    dispatch(notifyDirChange(item.localDir));
  };

  api.refreshDownloads(aria2Client, items, onUpdate, onComplete);
};


export const canPause = api.canPause;
export const canPauseAll = api.canPauseAll;
export const canResume = api.canResume;
export const canResumeAll = api.canResumeAll;
export const canCancel = api.canCancel;
export const canCancelAll = api.canCancelAll;

const onItemPaused = undefined; // do nothing
const onItemPauseFailed = err => {
  notifications.warn(`Unable to pause download for ${err.item.name}.`);
};
export const pauseItem = item => (dispatch, getState) => {
  const { aria2Client } = getState().downloader;
  api.pauseItem(aria2Client, item, onItemPaused, onItemPauseFailed);
};
export const pauseAll = items => (dispatch, getState) => {
  const { aria2Client } = getState().downloader;
  api.pauseAll(aria2Client, items, onItemPaused, onItemPauseFailed);
};

const onItemResumed = undefined; // do nothing
const onItemResumeFailed = err => {
  notifications.warn(`Unable to resume download for ${err.item.name}.`);
};
export const resumeItem = item => (dispatch, getState) => {
  const { aria2Client } = getState().downloader;
  api.resumeItem(aria2Client, item, onItemResumed, onItemResumeFailed);
};
export const resumeAll = items => (dispatch, getState) => {
  const { aria2Client } = getState().downloader;
  api.resumeAll(aria2Client, items, onItemResumed, onItemResumeFailed);
};

const onItemCancelled = dispatch => item => {
  dispatch(removeDownloadItem(item));
  dispatch(notifyDirChange(item.localDir));
};
const onItemCancelFailed = err => {
  notifications.warn(`Unable to cancel download for ${err.item.name}.`);
};
export const cancelItem = item => (dispatch, getState) => {
  const { aria2Client } = getState().downloader;
  api.cancelItem(aria2Client, item, onItemCancelled(dispatch), onItemCancelFailed);
};
export const cancelAll = items => (dispatch, getState) => {
  const { aria2Client } = getState().downloader;
  api.cancelAll(aria2Client, items, onItemCancelled(dispatch), onItemCancelFailed);
};


// private actions
const aria2cStartRequest = () => ({
  type: types.ARIA2C_START_REQUEST
});

const aria2cStartSuccess = client => ({
  type: types.ARIA2C_START_SUCCESS,
  client
});

const aria2cStartFailure = errorMsg => ({
  type: types.ARIA2C_START_FAILURE,
  errorMsg
});

const addDownloadItem = item => ({
  type: types.ADD_DOWNLOAD_ITEM,
  item
});

const updateDownloadItem = item => ({
  type: types.UPDATE_DOWNLOAD_ITEM,
  item
});

const removeDownloadItem = item => ({
  type: types.REMOVE_DOWNLOAD_ITEM,
  item
});

const notifyDirChange = dir => (dispatch, getState) => {
  if (dir === getState().localDir.dir) {
    dispatch(loadLocalDir(dir));
  }
};

import * as types from '../constants/ActionTypes';
import { Downloader } from '../api/downloader';
import { loadLocalDir } from '../actions/localDir';
import { getDownloadSuggestions } from '../actions/app';
import { joinURL } from '../utils/ftpUrl';
import notifications from '../utils/notifications';

const path = require('path');
const electron = require('electron');

export const startAria2 = () => async (dispatch) => {
  console.log('About to start Aria2 deamon');
  dispatch(initDownloaderRequest());
  return new Promise((resolve, reject) => {
    Downloader.init()
      .then(downloader => {
        dispatch(initDownloaderSuccess(downloader));
        initEventListeners(downloader, dispatch);
        return resolve(downloader);
      })
      .catch(err => {
        dispatch(initDownloaderFailure(err));
        electron.remote.dialog.showErrorBox('Can not start Aria2 deamon.', err);
        electron.remote.getCurrentWindow().close();
        reject();
      });
  });
};

export const addDownloads = (fileNames) => (dispatch, getState) => {
  const { localDir, ftp, downloader, settings } = getState();
  // todo: allow user specify split, currently use default setting in aria2.conf file
  // console.log(`addDownloads, split: ${split}, local dir: ${localDir.dir}`);
  console.log('addDownloads, local dir:', localDir.dir);

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

  downloader.setDownloadOptions({ split: settings.downloadSplit });
  downloader.addDownloads(uris, localDir.dir);
};

const initEventListeners = (downloader, dispatch) => {
  downloader.on('change', items => {
    dispatch(updateDownloadQueue(items));
  });

  downloader.on('item-add-failed', err => {
    notifications.error(
      `Failed to start downloading ${err.item.name}.`,
      `URL: to start downloading ${err.item.url}.`,
    );
  });

  downloader.on('item-completed', item => {
    notifications.info(
      `${item.name} has been downloaded successfully.`,
      `Full Path: ${path.join(item.localDir, item.name)}`,
      false, 5000
    );
    dispatch(notifyDirChange(item.localDir));
  });

  downloader.on('item-cancelled', item => {
    dispatch(notifyDirChange(item.localDir));
  });

  downloader.on('item-pause-failed', err => {
    notifications.warn(`Unable to pause download for ${err.item.name}.`);
  });
  downloader.on('item-resume-failed', err => {
    notifications.warn(`Unable to resume download for ${err.item.name}.`);
  });
  downloader.on('item-cancel-failed', err => {
    notifications.warn(`Unable to cancel download for ${err.item.name}.`);
  });

  // refresh downloading status every 0.5 second.
  setInterval(() => downloader.refresh(), 500);
};


// private actions
const initDownloaderRequest = () => ({
  type: types.INIT_DOWNLOADER_REQUEST
});

const initDownloaderSuccess = downloader => ({
  type: types.INIT_DOWNLOADER_SUCCESS,
  downloader
});

const initDownloaderFailure = errorMsg => ({
  type: types.INIT_DOWNLOADER_FAILURE,
  errorMsg
});

const updateDownloadQueue = items => ({
  type: types.UPDATE_DOWNLOAD_QUEUE,
  items
});

const notifyDirChange = dir => (dispatch, getState) => {
  if (dir === getState().localDir.dir) {
    dispatch(loadLocalDir(dir));
  }
};

import { combineReducers } from 'redux';
import { createForms } from 'react-redux-form';
import ui from './ui';
import settings from './settings';
import localDir from './localDir';
import ftp from './ftp';
import downloader from './downloader';
import downloadQueue from './downloadQueue';

const rootReducer = combineReducers({
  ui,
  settings,
  localDir,
  ftp,
  downloader,
  downloadQueue,
  ...createForms({
    localDirForm: { dir: '.' },
    ftpDirForm: { dir: '/' },
    ftpAddressForm: {
      host: '',
      user: '',
      password: '',
      port: 21
    }
  }),
});

export default rootReducer;

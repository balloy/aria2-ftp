/* eslint global-require: 0, flowtype-errors/show-errors: 0 */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build-main`, this file is compiled to
 * `./app/main.prod.js` using webpack. This gives us some performance wins.
 *
 * @flow
 */
import { app, BrowserWindow, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import MenuBuilder from './menu';

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

if (process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true') {
  require('electron-debug')();
  const path = require('path');
  const p = path.join(__dirname, '..', 'app', 'node_modules');
  require('module').globalPaths.push(p);
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = [
    'REACT_DEVELOPER_TOOLS',
    'REDUX_DEVTOOLS'
  ];

  return Promise
    .all(extensions.map(name => installer.default(installer[name], forceDownload)))
    .catch(console.log);
};


/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});


app.on('ready', async () => {
  if (process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true') {
    await installExtensions();
  }

  let mainWindow = null;

  // add a loading page to avoid slow starting up.
  // reference: https://stackoverflow.com/questions/42292608/electron-loading-animation
  const loading = new BrowserWindow({ show: false, frame: false, width: 600, height: 400 });
  loading.once('show', () => {
    mainWindow = new BrowserWindow({ show: false, width: 1200, height: 800 });

    mainWindow.webContents.once('dom-ready', () => {
      mainWindow.show();
      mainWindow.focus();

      loading.hide();
      loading.close();

      // auto update
      if (process.env.NODE_ENV === 'production') {
        // delay the auto update detect a few seconds, to avoid slowing down
        // the other initialazation tasks.
        setTimeout(() => {
          // enable logging
          autoUpdater.logger = require('electron-log');
          autoUpdater.logger.transports.file.level = 'info';
          autoUpdater.checkForUpdatesAndNotify();
        }, 10000);
      }
    });
    mainWindow.loadURL(`file://${__dirname}/app.html`);

    // setup the menu
    const menuBuilder = new MenuBuilder(mainWindow);
    menuBuilder.buildMenu();


    /**
     * Handle on closing event...
     */
    let showExitPrompt = true;

    // ask renderer process whether should close the app (mainWindow)
    mainWindow.on('close', e => {
      if (showExitPrompt) {
        e.preventDefault(); // Prevents the window from closing
        mainWindow.webContents.send('on-app-closing');
      }
    });

    // renderer allows the app to close
    ipcMain.on('allow-to-close', () => {
      showExitPrompt = false;
      mainWindow.close();
    });

    mainWindow.on('closed', () => {
      mainWindow = null;
    });
  });

  loading.loadURL(`file://${__dirname}/loading.html`);
  loading.show();
});

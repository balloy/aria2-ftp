// @flow
import { Menu, shell, BrowserWindow, dialog, app } from 'electron';

export default class MenuBuilder {
  mainWindow: BrowserWindow;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
  }

  buildMenu() {
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true') {
      this.setupDevelopmentEnvironment();
    }

    const template = process.platform === 'darwin'
      ? this.buildDarwinTemplate()
      : this.buildDefaultTemplate();

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);

    return menu;
  }

  setupDevelopmentEnvironment() {
    this.mainWindow.openDevTools({ mode: 'bottom' });
    this.mainWindow.webContents.on('context-menu', (e, props) => {
      const { x, y } = props;

      Menu
        .buildFromTemplate([{
          label: 'Inspect element',
          click: () => {
            this.mainWindow.inspectElement(x, y);
          }
        }])
        .popup(this.mainWindow);
    });
  }

  buildDarwinTemplate() {
    const win = this.mainWindow;
    const subMenuView = {
      label: 'View',
      submenu: [
        { label: 'File Size in Human Readable', type: 'radio', checked: true, click: () => onFileSizeFormatHuman(win) },
        { label: 'File Size in Bytes', type: 'radio', click: () => onFileSizeFormatBytes(win) },
        { type: 'separator' },
        { label: 'Toggle Full Screen', accelerator: 'Ctrl+Command+F', click: () => onToggleFullScreen(win) },
        { label: 'Toggle Developer Tools', accelerator: 'Alt+Command+I', click: () => onToggleDevTools(win) },
      ]
    };
    const subMenuWindow = {
      label: 'Window',
      submenu: [
        { label: 'Minimize', accelerator: 'Command+M', selector: 'performMiniaturize:' },
        { label: 'Close', accelerator: 'Command+W', selector: 'performClose:' },
        { type: 'separator' },
        { label: 'Bring All to Front', selector: 'arrangeInFront:' }
      ]
    };
    const subMenuHelp = {
      label: 'Help',
      submenu: [
        { label: 'About', click: () => onAbout() }
      ]
    };

    return [
      subMenuView,
      subMenuWindow,
      subMenuHelp
    ];
  }

  buildDefaultTemplate() {
    const win = this.mainWindow;
    const subMenuFile = {
      label: '&File',
      submenu: [
        { label: '&Close', accelerator: 'Ctrl+W', click: () => { win.close(); } }
      ]
    };
    const subMenuView = {
      label: '&View',
      submenu: [
        { label: 'File Size in &Human Readable', type: 'radio', checked: true, click: () => onFileSizeFormatHuman(win) },
        { label: 'File Size in &Bytes', type: 'radio', click: () => onFileSizeFormatBytes(win) },
        { type: 'separator' },
        { label: 'Toggle &Full Screen', accelerator: 'F11', click: () => onToggleFullScreen(win) },
        { label: 'Toggle &Developer Tools', accelerator: 'Ctrl+Shift+I', click: () => onToggleDevTools(win) },
      ]
    };
    const subMenuHelp = {
      label: '&Help',
      submenu: [
        { label: '&About', click: () => onAbout() }
      ]
    };

    return [
      subMenuFile,
      subMenuView,
      subMenuHelp
    ];
  }
}

// menu item handlers
const onFileSizeFormatHuman = win => {
  win.webContents.send('file-size-format', 'human');
};
const onFileSizeFormatBytes = win => {
  win.webContents.send('file-size-format', 'bytes');
};

const onToggleFullScreen = win => {
  win.setFullScreen(!win.isFullScreen());
};

const onToggleDevTools = win => {
  if (win.isDevToolsOpened()) {
    win.closeDevTools();
  } else {
    // Add options support
    win.openDevTools({ mode: 'bottom' });
  }
};

const onAbout = () => {
  dialog.showMessageBox({
    type: 'info',
    title: 'About',
    message: `aria2-ftp v${app.getVersion()}`,
    buttons: ['Homepage', 'OK'],
    defaultId: 1,
    noLink: true,
  }, resp => {
    if (resp === 0) {
      shell.openExternal('https://github.com/balloy/aria2-ftp');
    }
  });
};

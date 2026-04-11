import { BrowserWindow, app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { BrowserWindowSingleton } from './browserWindow';
import * as log from 'electron-log';
import * as windowStateKeeper from 'electron-window-state';

export const createMainApiManagementWindow = (isServe: boolean): void => {
  let mainWindowState = windowStateKeeper({
    defaultWidth: 1200,
    defaultHeight: 600,
  });

  try {
    let browserWindow: BrowserWindow | null = new BrowserWindow({
      x: mainWindowState.x,
      y: mainWindowState.y,
      width: mainWindowState.width,
      height: mainWindowState.height,
      autoHideMenuBar: true,
      frame: true,
      icon: 'app/assets/icon.png',
      titleBarStyle: 'hidden',
      webPreferences: {
        webSecurity: false,
        nodeIntegration: true,
        allowRunningInsecureContent: isServe,
        contextIsolation: false,
      },
    });
    mainWindowState.manage(browserWindow);

    // const NOTIFICATION_TITLE = 'Basic Notification';
    // const NOTIFICATION_BODY = 'Notification from the Main process';
    // new Notification({ title: NOTIFICATION_TITLE, body: NOTIFICATION_BODY }).show();

    // browserWindow.setMenu(null);
    // browserWindow.webContents.session.webRequest.onBeforeSendHeaders((details, callback) => {
    //   callback({ requestHeaders: { Origin: '*', ...details.requestHeaders } });
    // });
    //
    // browserWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    //   callback({
    //     responseHeaders: {
    //       'Access-Control-Allow-Origin': ['*'],
    //       'Access-Control-Allow-Headers': ['*'],
    //       ...details.responseHeaders,
    //     },
    //   });
    // });

    const appPath = app.getPath('userData');
    const appInstancePath = path.join(appPath, 'instances');
    if (!fs.existsSync(appInstancePath)) {
      fs.mkdirSync(appInstancePath);
    }

    if (isServe) {
      browserWindow.webContents.openDevTools();
      const debug = require('electron-debug');
      debug();

      require('electron-reload');
      browserWindow.loadURL('http://localhost:4200');
    } else {
      let pathIndex = './index.html';

      if (fs.existsSync(path.join(__dirname, '../dist/index.html'))) {
        pathIndex = '../dist/index.html';
      }

      void browserWindow.loadFile(path.join(__dirname, pathIndex));
    }
    browserWindow.on('closed', () => (browserWindow = null));

    BrowserWindowSingleton.setInstance(browserWindow);
  } catch (e) {
    log.error(e);
    log.error(e?.toString());
  }
};

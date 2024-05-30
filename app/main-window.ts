﻿import { BrowserWindow, nativeTheme, app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { BrowserWindowSingleton } from './browserWindow';
import * as Store from 'electron-store';
import { UserSettingStoreModel } from '../shared/models/user-setting.model';
import * as log from 'electron-log';
import * as windowStateKeeper from 'electron-window-state';

export const createMainApiManagementWindow = (isServe: boolean, store: Store<UserSettingStoreModel>): void => {
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
        nodeIntegration: true,
        allowRunningInsecureContent: isServe,
        contextIsolation: false,
      },
    });
    mainWindowState.manage(browserWindow);

    browserWindow.setMenu(null);
    browserWindow.webContents.session.webRequest.onBeforeSendHeaders((details, callback) => {
      callback({ requestHeaders: { Origin: '*', ...details.requestHeaders } });
    });

    browserWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          'Access-Control-Allow-Origin': ['*'],
          'Access-Control-Allow-Headers': ['*'],
          ...details.responseHeaders,
        },
      });
    });

    const theme = store.get('theme');
    if (!theme) {
      store.set('theme', 'system');
    }
    nativeTheme.themeSource = store.get('theme');

    const isTutorialDone = store.get('isTutorialDone');
    if (!isTutorialDone) {
      store.set('isTutorialDone', false);
    }

    const isExperimentalFunctionsActive = store.get('isExperimentalFunctionsActive');
    if (!isExperimentalFunctionsActive) {
      store.set('isExperimentalFunctionsActive', false);
    }

    const akiTags = store.get('akiTags');
    if (!akiTags) {
      store.set('akiTags', []);
    }

    const akiVersions = store.get('akiVersions');
    if (!akiVersions) {
      store.set('akiVersions', []);
    }

    const modCache = store.get('modCache');
    if (!modCache) {
      store.set('modCache', []);
    }

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

      const url = new URL(path.join('file:', __dirname, pathIndex));
      void browserWindow.loadURL(url.href);
    }
    browserWindow.on('closed', () => (browserWindow = null));

    BrowserWindowSingleton.setInstance(browserWindow);
  } catch (e) {
    log.error(e);
    log.error(e?.toString());
  }
};

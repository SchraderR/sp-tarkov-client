import { BrowserWindow, nativeTheme, app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { BrowserWindowSingleton } from './browserWindow';
import * as Store from 'electron-store';
import { UserSettingStoreModel } from '../shared/models/user-setting.model';
import * as log from 'electron-log';
import * as windowStateKeeper from 'electron-window-state';

export const createMainApiManagementWindow = async (isServe: boolean, store: Store<UserSettingStoreModel>): Promise<void> => {
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

    // const NOTIFICATION_TITLE = 'Basic Notification';
    // const NOTIFICATION_BODY = 'Notification from the Main process';
    // new Notification({ title: NOTIFICATION_TITLE, body: NOTIFICATION_BODY }).show();

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

    const keepTempDownloadDirectory = store.get('keepTempDownloadDirectory');
    if (!keepTempDownloadDirectory) {
      store.set('keepTempDownloadDirectory', false);
    }

    const isExperimentalFunctionsActive = store.get('isExperimentalFunctionsActive');
    if (!isExperimentalFunctionsActive) {
      store.set('isExperimentalFunctionsActive', false);
    }

    const sptInstances = store.get('sptInstances');
    if (!sptInstances) {
      store.set('sptInstances', []);
    }

    const modMetaData = store.get('modMetaData');
    if (!modMetaData) {
      store.set('modMetaData', []);
    }

    const sptTags = store.get('sptTags');
    if (!sptTags) {
      store.set('sptTags', []);
    }

    const sptVersions = store.get('sptVersions');
    if (!sptVersions) {
      store.set('sptVersions', []);
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

    migrateData(store);

    if (isServe) {
      browserWindow.webContents.openDevTools();
      const debug = require('electron-debug');
      debug();

      require('electron-reload');
      await browserWindow.loadURL('http://localhost:4200');
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

function migrateData(store: Store<UserSettingStoreModel>): void {
  const oldAkiInstances = store.get('akiInstances');
  if (oldAkiInstances) {
    store.set(
      'sptInstances',
      oldAkiInstances.map(i => ({ sptRootDirectory: i.akiRootDirectory, isActive: i.isActive }))
    );
    store.delete('akiInstances');
  }

  const oldAkiTags = store.get('akiTags');
  if (oldAkiTags) {
    store.set('sptTags', oldAkiTags);
    store.delete('akiTags');
  }

  const oldAkiVersions = store.get('akiVersions');
  if (oldAkiVersions) {
    store.set('sptVersions', oldAkiVersions);
    store.delete('akiVersions');
  }
}

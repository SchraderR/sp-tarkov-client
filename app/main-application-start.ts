﻿import { app } from 'electron';
import { createMainApiManagementWindow } from './main-window';
import { BrowserWindowSingleton } from './browserWindow';
import * as Store from 'electron-store';
import { UserSettingStoreModel } from '../shared/models/user-setting.model';

export const mainApplicationStart = (isServe: boolean, store: Store<UserSettingStoreModel>): void => {
  const browserWindow = BrowserWindowSingleton.getInstance();
  const instance = store.get('akiInstances');
  if (!instance) {
    store.set('akiInstances', []);
    store.set('theme', 'system');
    store.set('isTutorialDone', false);
    store.set('isExperimentalFunctionsActive', false);
  }

  try {
    app.on('ready', () => setTimeout(() => createMainApiManagementWindow(isServe, store), 400));
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('activate', () => {
      if (browserWindow === null) {
        createMainApiManagementWindow(isServe, store);
      }
    });
  } catch (e) {}
};

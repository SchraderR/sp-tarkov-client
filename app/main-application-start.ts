import { app, Tray } from 'electron';
import { createMainApiManagementWindow } from './main-window';
import { BrowserWindowSingleton } from './browserWindow';
import * as Store from 'electron-store';
import { UserSettingStoreModel } from '../shared/models/user-setting.model';
import * as path from 'path';

export const mainApplicationStart = (isServe: boolean, store: Store<UserSettingStoreModel>): void => {
  let tray: Tray | null;
  const iconPath = path.join(__dirname, 'assets/icon_tray.png');
  const browserWindow = BrowserWindowSingleton.getInstance();
  const instance = store.get('sptInstances');
  if (!instance) {
    store.set('sptInstances', []);
    store.set('theme', 'system');
    store.set('isTutorialDone', false);
    store.set('isExperimentalFunctionsActive', false);
  }

  if (process.platform === 'win32') {
    app.setAppUserModelId('SP-EFT Manager');
  }

  try {
    app.on('ready', () =>
      setTimeout(() => {
        void createMainApiManagementWindow(isServe, store);

        tray = new Tray(iconPath);
        //tray.on('double-click', () => {
        //  const browserWindow = BrowserWindowSingleton.getInstance();
        //  browserWindow.show();
        //});
        tray.setToolTip('EFT-SP Management Tool');

        //const contextMenu = Menu.buildFromTemplate([
        //  { label: '               ' },
        //  { type: 'separator' },
        //  { label: 'Close App', click: () => app.quit() },
        //]);
        //tray.setContextMenu(contextMenu);
      }, 400)
    );
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('activate', () => {
      if (browserWindow === null) {
        void createMainApiManagementWindow(isServe, store);
      }
    });
  } catch (e) {}
};

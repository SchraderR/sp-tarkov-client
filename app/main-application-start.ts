import { app, Tray } from 'electron';
import * as path from 'path';
import * as log from 'electron-log';
import { createMainApiManagementWindow } from './main-window';
import { BrowserWindow } from 'electron'; // only if you need it

export const mainApplicationStart = (isServe: boolean): void => {
  const iconPath = path.join(__dirname, 'assets/icon_tray.png');

  const start = () => {
    createMainApiManagementWindow(isServe);

    try {
      const tray = new Tray(iconPath);
      tray.setToolTip('EFT-SP Management Tool');
    } catch (e) {
      log.error('Failed to create tray:', e);
    }
  };

  if (app.isReady()) {
    setTimeout(start, 400);
  } else {
    app.once('ready', () => setTimeout(start, 400));
  }

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      start();
    }
  });
};

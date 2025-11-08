import { app, Tray, safeStorage } from 'electron';
import { createMainApiManagementWindow } from './main-window';
import { BrowserWindowSingleton } from './browserWindow';
import * as path from 'path';

export const mainApplicationStart = (isServe: boolean): void => {
  let tray: Tray | null;
  const iconPath = path.join(__dirname, 'assets/icon_tray.png');
  const browserWindow = BrowserWindowSingleton.getInstance();

  //if (process.platform === 'win32') {
  //  app.setAppUserModelId('SP-EFT Manager');
  //}

  try {
    app.on('ready', () =>
      setTimeout(() => {
        createMainApiManagementWindow(isServe);
        console.log(safeStorage.isEncryptionAvailable());

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
        createMainApiManagementWindow(isServe);
      }
    });
  } catch (e) {}
};

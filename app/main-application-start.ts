import { app } from 'electron';
import { createMainApiManagementWindow } from './main-window';
import { BrowserWindowSingleton } from './browserWindow';

export const mainApplicationStart = (isServe: boolean): void => {
  const browserWindow = BrowserWindowSingleton.getInstance();

  try {
    app.on('ready', () => setTimeout(() => createMainApiManagementWindow(isServe), 400));
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

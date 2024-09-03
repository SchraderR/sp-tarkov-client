import { ipcMain } from 'electron';
import { BrowserWindowSingleton } from '../browserWindow';

export const handleWindowEvents = () => {
  ipcMain.on('window-close', () => BrowserWindowSingleton.getInstance().hide());
  //ipcMain.on('window-close', () => BrowserWindowSingleton.getInstance().close());
  ipcMain.on('window-minimize', () => BrowserWindowSingleton.getInstance().minimize());
  ipcMain.on('window-maximize', () => {
    const browserWindow = BrowserWindowSingleton.getInstance();
    if (browserWindow.isMaximized()) {
      browserWindow.unmaximize();
    } else {
      browserWindow.maximize();
    }
  });
};

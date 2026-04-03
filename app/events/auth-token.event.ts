import { app, ipcMain } from 'electron';
import * as log from 'electron-log';
import { removeAuthToken } from '../auth-token/auth-token.helper';

export const handleAuthTokenEvent = () => {
  ipcMain.on('remove-auth-key', async (event, isRestart = false) => {
    await removeAuthToken();
    log.warn('Auth key removed. App will quit forcefully. IsRestart: ', isRestart);

    if (isRestart) {
      app.relaunch();
      app.quit();
    } else {
      app.quit();
    }
  });
};

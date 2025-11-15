import { app, ipcMain } from 'electron';
import * as log from 'electron-log';
import { removeAuthToken } from '../auth-token/auth-token.helper';

export const handleAuthTokenEvent = () => {
  ipcMain.on('remove-auth-key', async () => {
    await removeAuthToken();
    log.warn('Auth key removed. App will quit forcefully.');

    app.quit();
  });
};

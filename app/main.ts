import 'reflect-metadata';
import { mainApplicationStart } from './main-application-start';
import { autoUpdater } from 'electron-updater';
import * as log from 'electron-log';
import { initializeDatabase } from './database/helper/initialize.helper';
import { registerEventHandlers } from './helper/event-handler.helper';
import { app } from 'electron';
import { hasAuthToken, registerAuthTokenHeaderInterceptor } from './auth-token/auth-token.helper';
import { showAuthKeyDialog } from './auth-token/auth-token-dialog.helper';
import { ensureUserSettings } from './database/controller/user-setting.controller';

log.initialize();
const isServe = process.argv.slice(1).some(val => val === '--serve');

void initializeDatabase();

app.whenReady().then(async () => {
  await ensureUserSettings();
  if (!(await hasAuthToken())) {
    try {
      await showAuthKeyDialog();
    } catch (error) {
      log.error('User exited / dialog failed:', error);
      app.quit();
      return;
    }
  }

  if (await hasAuthToken()) {
    registerAuthTokenHeaderInterceptor();
    registerEventHandlers(isServe);
    mainApplicationStart(isServe);

    void autoUpdater.checkForUpdatesAndNotify();
  } else {
    log.error('No auth token found. Application will now quit.');
    app.quit();
    return;
  }
});

import 'reflect-metadata';
import { mainApplicationStart } from './main-application-start';
import { autoUpdater } from 'electron-updater';
import * as log from 'electron-log';
import { initializeDatabase } from './database/helper/initialize.helper';
import { registerEventHandlers } from './helper/event-handler.helper';
import { app } from 'electron';
import { ensureUserSettings } from './database/controller/user-setting.controller';

log.initialize();
const isServe = process.argv.slice(1).some(val => val === '--serve');

void initializeDatabase();

app.whenReady().then(async () => {
  await ensureUserSettings();

  registerEventHandlers(isServe);
  mainApplicationStart(isServe);

  void autoUpdater.checkForUpdatesAndNotify();
});

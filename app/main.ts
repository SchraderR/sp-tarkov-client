import 'reflect-metadata';
import * as Store from 'electron-store';
import { UserSettingStoreModel } from '../shared/models/user-setting.model';
import { mainApplicationStart } from './main-application-start';
import { autoUpdater } from 'electron-updater';
import * as log from 'electron-log';
import { initializeDatabaseAndMigration } from './database/helper/initialize.helper';
import { registerEventHandlers } from './helper/event-handler.helper';

log.initialize();
const isServe = process.argv.slice(1).some(val => val === '--serve');
const store = new Store<UserSettingStoreModel>();
const isMigrated = store.get('isMigrated');
if (!isMigrated) {
  store.set('isMigrated', false);
}

void initializeDatabaseAndMigration(store);
mainApplicationStart(isServe);
registerEventHandlers(isServe)

void autoUpdater.checkForUpdatesAndNotify();

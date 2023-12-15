import * as Store from 'electron-store';
import { UserSettingStoreModel } from '../shared/models/user-setting.model';
import { mainApplicationStart } from './main-application-start';
import { handleOpenDirectoryEvent } from './events/open-directory.event';
import { handleUserSettingStoreEvents } from './events/user-setting.event';
import { app } from 'electron';
import { handleDownloadLinkEvent } from './events/download-link-file.event';
import { handleDownloadModEvent } from './events/download-mod.event';

const isServe = process.argv.slice(1).some(val => val === '--serve');
const store = new Store<UserSettingStoreModel>();

console.log(app.getPath('userData'));

mainApplicationStart(isServe);
handleOpenDirectoryEvent(store);
handleDownloadLinkEvent();
handleDownloadModEvent();
handleUserSettingStoreEvents(store);

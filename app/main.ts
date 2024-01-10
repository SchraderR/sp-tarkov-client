import * as Store from 'electron-store';
import { UserSettingStoreModel } from '../shared/models/user-setting.model';
import { mainApplicationStart } from './main-application-start';
import { handleOpenDirectoryEvent } from './events/open-directory.event';
import { handleUserSettingStoreEvents } from './events/user-setting.event';
import { handleDownloadLinkEvent } from './events/download-link-file.event';
import { handleDownloadModEvent } from './events/download-mod.event';
import { handleFileUnzipEvent } from './events/file-unzip.event';
import { handleClientModsEvent } from './events/client-mods.event';
import { handleServerModsEvent } from './events/server-mods.event';
import { handleWindowEvents } from './events/window.event';
import { autoUpdater } from 'electron-updater';

const isServe = process.argv.slice(1).some(val => val === '--serve');
const store = new Store<UserSettingStoreModel>();
void autoUpdater.checkForUpdatesAndNotify();

mainApplicationStart(isServe);
handleOpenDirectoryEvent(store);
handleDownloadLinkEvent();
handleDownloadModEvent();
handleFileUnzipEvent();
handleUserSettingStoreEvents(store);
handleClientModsEvent();
handleServerModsEvent();
handleWindowEvents();

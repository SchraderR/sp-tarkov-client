import { handleOpenDirectoryEvent } from '../events/open-directory.event';
import { handleDownloadModEvent } from '../events/download-mod.event';
import { handleProcessDownloadLinkEvent } from '../events/handleProcessDownloadLinkEvent';
import { handleFileUnzipEvent } from '../events/file-unzip.event';
import { handleUserSettingStoreEvents } from '../events/user-setting.event';
import { handleClientModsEvent } from '../events/client-mods.event';
import { handleServerModsEvent } from '../events/server-mods.event';
import { handleWindowEvents } from '../events/window.event';
import { handleClearTemporaryDirectoryEvent } from '../events/clear-temp.event';
import { handleThemeEvents } from '../events/theme.event';
import { handleTutorialEvents } from '../events/tutorial.event';
import { handleTarkovStartEvent } from '../events/tarkov-start.event';
import { handleExperimentalFunctionsEvents } from '../events/experimental-functions.event';
import { handleModLoadOrderEvents } from '../events/mod-load-order.event';
import { handleUpdateModEvents } from '../events/update-mod.event';
import { handleModCacheEvents } from '../events/mod-list-cache.event';
import { toggleModStateEvent } from '../events/toggle-mod-state.event';
import { handleModPageEvents } from '../events/mod-page.event';
import { handleTempDownloadDirectoryEvents } from '../events/temp-download-directory.event';
import { handleAuthTokenEvent } from '../events/auth-token.event';
import { handleShellEvents } from '../events/shell.event';
import * as log from 'electron-log';

export function registerEventHandlers(isServe: boolean): void {
  try {
    handleOpenDirectoryEvent();
    handleDownloadModEvent();
    handleProcessDownloadLinkEvent();
    handleFileUnzipEvent(isServe);
    handleUserSettingStoreEvents();
    handleClientModsEvent();
    handleServerModsEvent();
    handleWindowEvents();
    handleClearTemporaryDirectoryEvent();
    handleThemeEvents();
    handleTutorialEvents();
    handleTarkovStartEvent();
    handleExperimentalFunctionsEvents();
    handleModLoadOrderEvents();
    handleUpdateModEvents();
    handleModCacheEvents();
    toggleModStateEvent();
    handleModPageEvents();
    handleTempDownloadDirectoryEvents();
    handleAuthTokenEvent();
    handleShellEvents();
    log.info('IPC event handlers registered');
  } catch (e) {
    log.error('Error registering event handlers', e);
  }
}

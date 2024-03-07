import { ipcMain, nativeTheme } from 'electron';
import * as Store from 'electron-store';
import { Theme, UserSettingStoreModel } from '../../shared/models/user-setting.model';

export const handleExperimentalFunctionsEvents = (store: Store<UserSettingStoreModel>) => {
  ipcMain.on('exp-function-setting', event => event.sender.send('exp-function-setting-completed', store.get('isExperimentalFunctionsActive')));
  ipcMain.on('exp-function-toggle', (event, isExperimentalFunctionsActive: boolean) => {
    store.set('isExperimentalFunctionsActive', isExperimentalFunctionsActive);
    event.sender.send('exp-function-toggle-completed');
  });
};

import { ipcMain } from 'electron';
import * as Store from 'electron-store';
import { UserSettingStoreModel } from '../../shared/models/user-setting.model';

export const handleCheckInstalledEvents = (store: Store<UserSettingStoreModel>) => {
  ipcMain.on('check-installed-setting', event => event.sender.send('check-installed-setting-completed', store.get('isCheckInstalledActive')));
  ipcMain.on('check-installed-toggle', (event, isCheckInstalledActive: boolean) => {
    store.set('isCheckInstalledActive', isCheckInstalledActive);
    event.sender.send('check-installed-toggle-completed');
  });
};

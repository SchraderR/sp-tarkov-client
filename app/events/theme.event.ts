import { ipcMain, nativeTheme } from 'electron';
import * as Store from 'electron-store';
import { Theme, UserSettingStoreModel } from '../../shared/models/user-setting.model';

export const handleThemeEvents = (store: Store<UserSettingStoreModel>) => {
  ipcMain.on('theme-setting', event => event.sender.send('theme-setting-completed', store.get('theme')));
  ipcMain.on('theme-toggle', (event, theme: Theme) => {
    store.set('theme', theme);
    nativeTheme.themeSource = theme;

    event.sender.send('theme-toggle-completed');
  });
};

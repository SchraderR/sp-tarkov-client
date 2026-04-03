import { ipcMain, nativeTheme } from 'electron';
import { Theme } from '../../shared/models/user-setting.model';
import { getUserSettingProperty, setUserSettingProperty } from '../database/controller/user-setting.controller';

export const handleThemeEvents = () => {
  ipcMain.on('theme-setting', async event => event.sender.send('theme-setting-completed', await getUserSettingProperty('theme')));
  ipcMain.on('theme-toggle', async (event, theme: Theme) => {
    await setUserSettingProperty('theme', theme);
    nativeTheme.themeSource = theme;
    event.sender.send('theme-toggle-completed');
  });
};

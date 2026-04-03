import { ipcMain } from 'electron';
import { getUserSettingProperty, setUserSettingProperty } from '../database/controller/user-setting.controller';

export const handleExperimentalFunctionsEvents = () => {
  ipcMain.on('exp-function-setting', async event =>
    event.sender.send('exp-function-setting-completed', await getUserSettingProperty('isExperimentalFunctionsActive'))
  );

  ipcMain.on('exp-function-toggle', async (event, isExperimentalFunctionsActive: boolean) => {
    await setUserSettingProperty('isExperimentalFunctionsActive', isExperimentalFunctionsActive);
    event.sender.send('exp-function-toggle-completed');
  });
};

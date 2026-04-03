import { ipcMain } from 'electron';
import { getUserSettingProperty, setUserSettingProperty } from '../database/controller/user-setting.controller';

export const handleTutorialEvents = () => {
  ipcMain.on('tutorial-setting', async event => event.sender.send('tutorial-setting-completed', await getUserSettingProperty('isTutorialDone')));
  ipcMain.on('tutorial-toggle', async (event, isTutorialDone: boolean) => {
    await setUserSettingProperty('isTutorialDone', isTutorialDone);
    event.sender.send('tutorial-toggle-completed');
  });
};

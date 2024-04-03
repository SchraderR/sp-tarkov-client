import { ipcMain } from 'electron';
import * as Store from 'electron-store';
import { UserSettingStoreModel } from '../../shared/models/user-setting.model';

export const handleTutorialEvents = (store: Store<UserSettingStoreModel>) => {
  ipcMain.on('tutorial-setting', event => event.sender.send('tutorial-setting-completed', store.get('isTutorialDone')));
  ipcMain.on('tutorial-toggle', (event, isTutorialDone: boolean) => {
    store.set('isTutorialDone', isTutorialDone);
    event.sender.send('tutorial-toggle-completed');
  });
};

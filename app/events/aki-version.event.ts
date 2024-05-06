import { ipcMain } from 'electron';
import * as Store from 'electron-store';
import { UserSettingStoreModel } from '../../shared/models/user-setting.model';
import { AkiVersion } from '../../shared/models/aki-core.model';

export const handleAkiVersionEvents = (store: Store<UserSettingStoreModel>) => {
  ipcMain.on('aki-versions', event => event.sender.send('aki-versions-completed', store.get('akiVersions')));
  ipcMain.on('aki-versions-save', (event, akiVersions: AkiVersion[]) => {
    store.set('akiVersions', akiVersions);
    event.sender.send('aki-versions-save-completed');
  });
};

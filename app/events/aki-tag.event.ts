import { ipcMain } from 'electron';
import * as Store from 'electron-store';
import { UserSettingStoreModel } from '../../shared/models/user-setting.model';
import { AkiTag } from '../../shared/models/aki-core.model';

export const handleAkiTagEvents = (store: Store<UserSettingStoreModel>) => {
  ipcMain.on('aki-tags', event => event.sender.send('aki-tags-completed', store.get('akiTags')));
  ipcMain.on('aki-tags-save', (event, akiTags: AkiTag[]) => {
    store.set('akiTags', akiTags);
    event.sender.send('aki-tags-save-completed');
  });
};

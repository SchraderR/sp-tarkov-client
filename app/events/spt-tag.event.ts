import { ipcMain } from 'electron';
import * as Store from 'electron-store';
import { UserSettingStoreModel } from '../../shared/models/user-setting.model';
import { SptTag } from '../../shared/models/spt-core.model';

export const handleSptTagEvents = (store: Store<UserSettingStoreModel>) => {
  ipcMain.on('spt-tags', event => event.sender.send('spt-tags-completed', store.get('sptTags')));
  ipcMain.on('spt-tags-save', (event, aptTags: SptTag[]) => {
    store.set('sptTags', aptTags);
    event.sender.send('spt-tags-save-completed');
  });
};

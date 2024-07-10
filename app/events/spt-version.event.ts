import { ipcMain } from 'electron';
import * as Store from 'electron-store';
import { UserSettingStoreModel } from '../../shared/models/user-setting.model';
import { SptVersion } from '../../shared/models/spt-core.model';

export const handleSptVersionEvents = (store: Store<UserSettingStoreModel>) => {
  ipcMain.on('spt-versions', event => event.sender.send('spt-versions-completed', store.get('sptVersions')));
  ipcMain.on('spt-versions-save', (event, sptVersions: SptVersion[]) => {
    store.set('sptVersions', sptVersions);
    event.sender.send('spt-versions-save-completed');
  });
};

import { UserSettingStoreModel } from '../../shared/models/user-setting.model';
import { ipcMain } from 'electron';
import * as Store from 'electron-store';

export const handleIndexedModsEvents = (store: Store<UserSettingStoreModel>) => {
    ipcMain.on('use-indexed-mods-save', (event, value) => {
        try {
            store.set('useIndexedMods', value);
            event.sender.send('use-indexed-mods-save-completed');
        } catch (error) {
            event.sender.send('use-indexed-mods-save-error', error);
        }
    });

    ipcMain.on('use-indexed-mods', event => {
        try {
            const useIndexedMods = store.get('useIndexedMods');
            event.sender.send('use-indexed-mods-completed', useIndexedMods);
        } catch (error) {
            event.sender.send('use-indexed-mods-error', error);
        }
    });
}

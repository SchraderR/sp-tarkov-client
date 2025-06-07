import * as Store from 'electron-store';
import { ModCache, UserSettingStoreModel } from '../../shared/models/user-setting.model';
import { ipcMain } from 'electron';
import * as log from 'electron-log';

export const handleModCacheEvents = (store: Store<UserSettingStoreModel>) => {
  ipcMain.on('mod-list-cache', event => event.sender.send('mod-list-cache-completed', store.get('modCache')));

  ipcMain.on('add-mod-list-cache', (event, modCache: ModCache) => {
    const modCacheList = new Set(store.get('modCache'));
    modCacheList.add(modCache);

    store.set('modCache', Array.from(modCacheList));
    event.sender.send('add-mod-list-cache-completed');
  });

  // TODO Refactor modName to modId
  ipcMain.on('remove-mod-list-cache', (event, modName: string) => {
    const modCacheList = new Set(store.get('modCache'));
    const mod = Array.from(modCacheList).find(m => m.name === modName);
    if (!mod) {
      log.warn(`Mod ${modName} not found. Cant remove from cache.`);
      event.sender.send('remove-mod-list-cache-completed');
      return;
    }

    modCacheList.delete(mod);
    store.set('modCache', Array.from(modCacheList));
    event.sender.send('remove-mod-list-cache-completed');
  });
};

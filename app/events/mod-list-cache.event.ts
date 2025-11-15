import { ipcMain } from 'electron';
import * as log from 'electron-log';
import { addModToInstanceCache, getInstanceProperty, removeModFromInstanceCache } from '../database/controller/instance.controller';
import { ModCacheModel } from '../../shared/models/mod-cache.model';

export const handleModCacheEvents = () => {
  ipcMain.on('mod-list-cache', async (event, instanceId: number) =>
    event.sender.send('mod-list-cache-completed', await getInstanceProperty(instanceId, 'modCache'))
  );

  ipcMain.on('add-mod-list-cache', async (event, modCache: ModCacheModel) => {
    try {
      const success = await addModToInstanceCache(modCache.instanceId, modCache.modId);

      if (success) {
        event.sender.send('add-mod-list-cache-completed');
      } else {
        event.sender.send('add-mod-list-cache-error', 'Mod already in cache');
      }
    } catch (error) {
      log.error('Error adding mod to cache:', error);
      event.sender.send('add-mod-list-cache-error', error);
    }
  });

  ipcMain.on('remove-mod-list-cache', async (event, modCache: ModCacheModel) => {
    try {
      const success = await removeModFromInstanceCache(modCache.instanceId, modCache.modId);

      if (success) {
        event.sender.send('remove-mod-list-cache-completed');
      } else {
        log.warn(`Mod ${modCache.modId} not found in cache for instance ${modCache.instanceId}`);
        event.sender.send('remove-mod-list-cache-completed'); // Still complete even if not found
      }
    } catch (error) {
      log.error('Error removing mod from cache:', error);
      event.sender.send('remove-mod-list-cache-error', error);
    }
  });
};

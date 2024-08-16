import { ipcMain } from 'electron';
import * as Store from 'electron-store';
import { UserSettingStoreModel } from '../../shared/models/user-setting.model';
import * as path from 'path';
import { existsSync, readdir, stat } from 'fs-extra';
import * as log from 'electron-log';

export const handleTempDownloadDirectoryEvents = (store: Store<UserSettingStoreModel>) => {
  ipcMain.on('keep-temp-dir-setting', event => event.sender.send('keep-temp-dir-setting-completed', store.get('keepTempDownloadDirectory')));
  ipcMain.on('keep-temp-dir-setting-toggle', (event, keepTempDownloadDirectory: boolean) => {
    store.set('keepTempDownloadDirectory', keepTempDownloadDirectory);
    event.sender.send('keep-temp-dir-setting-toggle-completed');
  });

  ipcMain.on('keep-temp-dir-size', async (event, instancePath: string) => {
    const tempDownloadDir = path.join(instancePath, '_temp');
    if (!existsSync(tempDownloadDir)) {
      event.sender.send('keep-temp-dir-size-completed', 0);
      return;
    }
    try {
      const size = await getDirectorySize(tempDownloadDir);
      log.info(`Current size: ${size}`);
      event.sender.send('keep-temp-dir-size-completed', size);
    } catch (error) {
      log.error(error);
      event.sender.send('keep-temp-dir-size-completed', 0);
    }
  });
};

async function getDirectorySize(dirPath: string) {
  const entries = await readdir(dirPath, { withFileTypes: true });

  const sizes: number[] = await Promise.all(
    entries.map(async entry => {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        return await getDirectorySize(fullPath);
      } else {
        const fullPathStat = await stat(fullPath);
        return fullPathStat.size;
      }
    })
  );

  return sizes.reduce((total, size) => total + size, 0);
}

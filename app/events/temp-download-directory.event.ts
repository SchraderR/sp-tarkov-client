import { ipcMain, shell } from 'electron';
import * as path from 'path';
import * as log from 'electron-log';
import { existsSync, readdir, stat } from 'fs-extra';
import { getUserSettingProperty , setUserSettingProperty } from '../database/controller/user-setting.controller';
import { getTempDownloadDirectory } from '../helper/temp-directory.helper';

export const handleTempDownloadDirectoryEvents = () => {
  ipcMain.on('keep-temp-dir-setting', async event =>
    event.sender.send('keep-temp-dir-setting-completed', await getUserSettingProperty('keepTempDownloadDirectory'))
  );

  ipcMain.on('keep-temp-dir-setting-toggle', async (event, keepTempDownloadDirectory: boolean) => {
    await setUserSettingProperty('keepTempDownloadDirectory', keepTempDownloadDirectory);
    event.sender.send('keep-temp-dir-setting-toggle-completed');
  });

  ipcMain.on('temp-dir-size', async event => {
    const tempDownloadDir = getTempDownloadDirectory();
    if (!existsSync(tempDownloadDir)) {
      event.sender.send('temp-dir-size-completed', 0);
      return;
    }
    try {
      const size = await getDirectorySize(tempDownloadDir);
      log.info(`Current size: ${size}`);
      event.sender.send('temp-dir-size-completed', size);
    } catch (error) {
      log.error(error);
      event.sender.send('temp-dir-size-completed', 0);
    }
  });

  ipcMain.on('open-temp-dir', async event => {
    const tempDownloadDir = getTempDownloadDirectory();
    if (existsSync(tempDownloadDir)) {
      await shell.openPath(tempDownloadDir);
    }
    event.sender.send('open-temp-dir-completed');
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

import { ipcMain } from 'electron';
import * as path from 'path';
import { existsSync, rmSync } from 'fs-extra';

export const handleClearTemporaryDirectoryEvent = () => {
  ipcMain.on('clear-temp', (event, instancePath: string) => {
    const tempDownloadDir = path.join(instancePath, '_temp');
    if (!existsSync(tempDownloadDir)) {
      return;
    }

    rmSync(tempDownloadDir, { recursive: true });

    event.sender.send('clear-temp-completed');
  });
};

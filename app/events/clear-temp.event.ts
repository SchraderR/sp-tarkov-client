import { ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

export const handleClearTemporaryDirectoryEvent = () => {
  ipcMain.on('clear-temp', (event, instancePath: string) => {
    const tempDownloadDir = path.join(instancePath, '_temp');
    if (!fs.existsSync(tempDownloadDir)) {
      return;
    }

    fs.rmdirSync(tempDownloadDir, { recursive: true });

    event.sender.send('clear-temp-completed');
  });
};

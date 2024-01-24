import { ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

export const handleClearTemporaryDirectoryEvent = () => {
  ipcMain.on('clear-temp', (event, akiInstancePath: string) => {
    const ankiTempDownloadDir = path.join(akiInstancePath, '_temp');
    if (!fs.existsSync(ankiTempDownloadDir)) {
      return;
    }

    fs.rmdirSync(ankiTempDownloadDir, { recursive: true });

    event.sender.send('clear-temp-completed');
  });
};

import { ipcMain } from 'electron';
import * as fs from 'fs';
import { getTempDownloadDirectory } from '../helper/temp-directory.helper';

export const handleClearTemporaryDirectoryEvent = () => {
  ipcMain.on('clear-temp', event => {
    const tempDownloadDir = getTempDownloadDirectory();
    if (!fs.existsSync(tempDownloadDir)) {
      event.sender.send('clear-temp-completed');
      return;
    }

    fs.rmSync(tempDownloadDir, { recursive: true, force: true });

    event.sender.send('clear-temp-completed');
  });
};

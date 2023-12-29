import { ipcMain } from 'electron';
import { download } from 'electron-dl';
import { BrowserWindowSingleton } from '../browserWindow';
import { DownloadModel } from '../../shared/models/aki-core.model';
import * as path from 'path';
import * as fs from 'fs';

export const handleDownloadModEvent = () => {
  ipcMain.on('download-mod', async (event, downloadModel: DownloadModel) => {
    const ankiTempDownloadDir = path.join(downloadModel.akiInstancePath, '_temp');
    if (!fs.existsSync(ankiTempDownloadDir)) {
      fs.mkdirSync(ankiTempDownloadDir);
    }

    console.log(downloadModel.modFileUrl);
    await download(BrowserWindowSingleton.getInstance(), downloadModel.modFileUrl, {
      directory: ankiTempDownloadDir,
      saveAs: false,
      onProgress: progress => event.sender.send('download-mod-progress', progress),
      onCompleted: file => event.sender.send('download-mod-completed', file),
    });
  });
};

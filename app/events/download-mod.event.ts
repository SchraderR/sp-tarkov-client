import { ipcMain } from 'electron';
import { download } from 'electron-dl';
import { BrowserWindowSingleton } from '../browserWindow';
import { DownloadModel } from '../../shared/models/aki-core.model';
import * as path from 'path';
import * as fs from 'fs';
import axios from 'axios';

export const handleDownloadModEvent = () => {
  ipcMain.on('download-mod', async (event, downloadModel: DownloadModel) => {
    const ankiTempDownloadDir = path.join(downloadModel.akiInstancePath, '_temp');
    if (!fs.existsSync(ankiTempDownloadDir)) {
      fs.mkdirSync(ankiTempDownloadDir);
    }

    if (downloadModel.modFileUrl.startsWith('https://hub.sp-tarkov.com/files/download')) {
      await handleDirectDownload(event, ankiTempDownloadDir, downloadModel);
      return;
    }

    await download(BrowserWindowSingleton.getInstance(), downloadModel.modFileUrl, {
      directory: ankiTempDownloadDir,
      saveAs: false,
      onProgress: progress => event.sender.send('download-mod-progress', progress),
      onCompleted: file => event.sender.send('download-mod-completed', file),
    });
  });
};

async function handleDirectDownload(event: Electron.IpcMainEvent, ankiTempDownloadDir: string, downloadModel: DownloadModel) {
  const file = fs.createWriteStream(path.join(ankiTempDownloadDir, `test.zip`));
  await axios({ url: downloadModel.modFileUrl, method: 'GET', responseType: 'stream' });

  file.on('finish', () => event.sender.send('download-mod-completed', file));
}

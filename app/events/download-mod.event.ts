import { ipcMain } from 'electron';
import { download } from 'electron-dl';
import { BrowserWindowSingleton } from '../browserWindow';
import { DownloadModel } from '../../shared/models/aki-core.model';
import * as path from 'node:path';
import * as fs from 'fs';

export const handleDownloadModEvent = () => {
  ipcMain.on('download-mod', async (event, downloadModel: DownloadModel) => {
    const ankiTempDownloadDir = path.join(downloadModel.akiInstancePath, '_temp');
    if (!fs.existsSync(ankiTempDownloadDir)) {
      fs.mkdirSync(ankiTempDownloadDir);
    }

    await download(BrowserWindowSingleton.getInstance(), downloadModel.modFileUrl, {
      directory: ankiTempDownloadDir,
      saveAs: false,
      onProgress: progress => event.sender.send(`download-mod-progress-${downloadModel.fileId}`, progress),
      onCompleted: file => {
        event.sender.send('download-mod-completed', 'userSettingModelResult');
      },
    });

    // const zip = new AdmZip(downloadMod.getSavePath());
    // zip.getEntries().forEach(f => {
    //   if (f.entryName.indexOf('BepInEx/plugins/') === 0) {
    //     zip.extractEntryTo(f.entryName, downloadModel.akiInstancePath, true, true);
    //   }
    // });
    //
    // if (fs.existsSync(ankiTempDownloadDir)) {
    //   fs.rmdirSync(ankiTempDownloadDir, { recursive: true });
    // }
  });
};

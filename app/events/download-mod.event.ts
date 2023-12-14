import { ipcMain } from 'electron';
import * as AdmZip from 'adm-zip';
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

    const downloadMod = await download(BrowserWindowSingleton.getInstance(), downloadModel.url, { directory: ankiTempDownloadDir });
    const zip = new AdmZip(downloadMod.getSavePath());
    zip.getEntries().forEach(f => {
      if (f.entryName.indexOf('BepInEx/plugins/') === 0) {
        zip.extractEntryTo(f.entryName, downloadModel.akiInstancePath, true, true);
      }
    });

    if (fs.existsSync(ankiTempDownloadDir)) {
      fs.rmdirSync(ankiTempDownloadDir, { recursive: true });
    }

    event.sender.send('download-mod-complete', 'userSettingModelResult');
  });
};

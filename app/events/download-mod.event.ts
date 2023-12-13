import { BrowserWindow, ipcMain } from 'electron';
import * as os from 'os';
import * as AdmZip from 'adm-zip';
import * as path from 'path';
import fetch from 'electron-fetch';
import { download } from 'electron-dl';
import { BrowserWindowSingleton } from '../browserWindow';

export const handleDownloadModEvent = () => {
  ipcMain.on('download-mod', async (event, info) => {
    const downloadFilePath = path.join(os.homedir(), 'Downloads', 'Test');
    console.log(downloadFilePath);
    console.log(info[0]);

    var ttt = await download(BrowserWindowSingleton.getInstance(), info[0], { directory: downloadFilePath });
    console.log(ttt.getSavePath());
    const zip = new AdmZip(ttt.getSavePath());

    zip.getEntries().forEach(f => {
      console.log(f.name);
      console.log(f.isDirectory);
      console.log(f.entryName);
    });

    // zip.extractAllTo('C:\\Users\\heene\\Downloads\\Test', true);
    console.log('Done!');
    event.sender.send('download-moxd-complete', 'userSettingModelResult');
  });
};

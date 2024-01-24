import { app, ipcMain } from 'electron';
import { download } from 'electron-dl';
import { BrowserWindowSingleton } from '../browserWindow';
import { DownloadModel } from '../../shared/models/aki-core.model';
import * as path from 'path';
import * as fs from 'fs';
import axios from 'axios';
import { Browser, launch } from 'puppeteer';

export const handleDownloadModEvent = () => {
  ipcMain.on('download-mod', async (event, downloadModel: DownloadModel) => {
    let browser: Browser | null = null;
    const ankiTempDownloadDir = path.join(downloadModel.akiInstancePath, '_temp');
    if (!fs.existsSync(ankiTempDownloadDir)) {
      fs.mkdirSync(ankiTempDownloadDir);
    }

    if (downloadModel.modFileUrl.includes('docs.google.com')) {
      browser = await launch({
        headless: 'new',
        executablePath: `${app.getPath('home')}/.local-chromium/chrome/win64-122.0.6257.0/chrome-win64/chrome.exe`,
      });

      const isDownloadCompleted = await waitForDownload(downloadModel, browser, event, ankiTempDownloadDir);
      if (isDownloadCompleted) {
        return;
      }
    }

    if (downloadModel.modFileUrl.startsWith('https://hub.sp-tarkov.com/files/download')) {
      await handleDirectDownload(event, ankiTempDownloadDir, downloadModel);
      return;
    }

    await download(BrowserWindowSingleton.getInstance(), downloadModel.modFileUrl, {
      directory: ankiTempDownloadDir,
      saveAs: false,
      onProgress: progress => event.sender.send('download-mod-progress', progress),
      onCompleted: file => event.sender.send('download-mod-completed', file.path),
      onCancel: () => event.sender.send('download-mod-error', 1),
    });
  });
};

async function handleDirectDownload(event: Electron.IpcMainEvent, ankiTempDownloadDir: string, downloadModel: DownloadModel) {
  const file = fs.createWriteStream(path.join(ankiTempDownloadDir, `test.zip`));
  await axios({ url: downloadModel.modFileUrl, method: 'GET', responseType: 'stream' });

  file.on('finish', () => event.sender.send('download-mod-completed', file));
}

async function waitForDownload(downloadModel: DownloadModel, browser: Browser, event: Electron.IpcMainEvent, ankiTempDownloadDir: string) {
  return new Promise<boolean>(async (resolve, reject) => {
    try {
      let guids: any = {};

      const page = await browser.newPage();
      const client = await page.target().createCDPSession();
      await client.send('Browser.setDownloadBehavior', { behavior: 'allowAndName', downloadPath: ankiTempDownloadDir, eventsEnabled: true });

      client.on('Browser.downloadWillBegin', async event => (guids[event.guid] = event.suggestedFilename));
      client.on('Browser.downloadProgress', async progressEvent => {
        if (progressEvent.state === 'inProgress') {
          event.sender.send('download-mod-progress', {
            percent: progressEvent.receivedBytes / progressEvent.totalBytes,
            transferredBytes: progressEvent.receivedBytes,
            totalBytes: progressEvent.totalBytes,
          });
        } else if (progressEvent.state === 'completed') {
          fs.renameSync(path.resolve(ankiTempDownloadDir, progressEvent.guid), path.resolve(ankiTempDownloadDir, guids[progressEvent.guid]));
          event.sender.send('download-mod-progress', {
            percent: 100,
            transferredBytes: progressEvent.receivedBytes,
            totalBytes: progressEvent.totalBytes,
          });
          event.sender.send('download-mod-completed', path.resolve(ankiTempDownloadDir, guids[progressEvent.guid]));
          await browser?.close();
          resolve(true); // Resolve promise here
        }
      });

      await page.goto(downloadModel.modFileUrl, { waitUntil: 'networkidle2' });
      await browser.close();
    } catch (error) {
      console.log(error);
      event.sender.send('download-mod-error', 1);
    }
  });
}

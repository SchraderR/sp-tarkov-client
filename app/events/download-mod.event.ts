import { app, ipcMain } from 'electron';
import { download } from 'electron-dl';
import { BrowserWindowSingleton } from '../browserWindow';
import { DownloadModel } from '../../shared/models/aki-core.model';
import * as path from 'path';
import * as fs from 'fs';
import axios from 'axios';
import { Browser, launch } from 'puppeteer';

const DOWNLOAD_TIMEOUT = 60000;
export const handleDownloadModEvent = () => {
  ipcMain.on('download-mod', async (event, downloadModel: DownloadModel) => {
    let browser: Browser | null = null;
    try {
      const ankiTempDownloadDir = path.join(downloadModel.akiInstancePath, '_temp');
      if (!fs.existsSync(ankiTempDownloadDir)) {
        fs.mkdirSync(ankiTempDownloadDir);
      }

      if (!downloadModel.modFileUrl) {
        event.sender.send('download-mod-error', 1);
        return;
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
    } catch (e) {
      event.sender.send('download-mod-error', 1);
      await browser?.close();
    }
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
      let downloadTimeoutId: any; // This will store the ID for the setTimeout call

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
          clearTimeout(downloadTimeoutId);
        } else if (progressEvent.state === 'completed') {
          fs.renameSync(path.resolve(ankiTempDownloadDir, progressEvent.guid), path.resolve(ankiTempDownloadDir, guids[progressEvent.guid]));
          event.sender.send('download-mod-progress', {
            percent: 100,
            transferredBytes: progressEvent.receivedBytes,
            totalBytes: progressEvent.totalBytes,
          });
          event.sender.send('download-mod-completed', path.resolve(ankiTempDownloadDir, guids[progressEvent.guid]));
          await browser?.close();
          resolve(true);
          clearTimeout(downloadTimeoutId);
        }
      });

      downloadTimeoutId = setTimeout(() => reject(new Error('Download timeout')), DOWNLOAD_TIMEOUT);
      await page.goto(downloadModel.modFileUrl, { waitUntil: 'networkidle2' });
      const form = await page.$('#download-form');
      if (form) {
        await page.evaluate((f: Element) => (f as HTMLFormElement).submit(), form);
      }
    } catch (error: any) {
      if (error?.message?.includes('net::ERR_ABORTED')) {
        return;
      }

      event.sender.send('download-mod-error', 1);
      await browser.close();
    }
  });
}

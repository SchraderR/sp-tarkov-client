import { app, ipcMain } from 'electron';
import { download } from 'electron-dl';
import { BrowserWindowSingleton } from '../browserWindow';
import { DownloadModel } from '../../shared/models/spt-core.model';
import * as path from 'path';
import axios from 'axios';
import { Browser, launch } from 'puppeteer';
import * as log from 'electron-log';
import { File } from 'megajs';
import { createWriteStream, renameSync, writeFileSync } from 'node:fs';
import { existsSync, mkdirSync } from 'fs-extra';

const DOWNLOAD_TIMEOUT = 60000;
export const handleDownloadModEvent = () => {
  let browser: Browser | null = null;

  ipcMain.on('download-mod', async (event, downloadModel: DownloadModel) => {
    try {
      const ankiTempDownloadDir = path.join(downloadModel.sptInstancePath, '_temp');
      if (!existsSync(ankiTempDownloadDir)) {
        mkdirSync(ankiTempDownloadDir);
      }

      if (!downloadModel.modFileUrl) {
        event.sender.send('download-mod-error', 1);
        return;
      }

      if (downloadModel.modFileUrl.includes('docs.google.com') || downloadModel.modFileUrl.includes('dropbox')) {
        browser = await launch({
          headless: true,
          executablePath: `${app.getPath('home')}/.local-chromium/chrome/win64-127.0.6533.88/chrome-win64/chrome.exe`,
        });

        const isDownloadCompleted = await waitForDownload(downloadModel, browser, event, ankiTempDownloadDir);
        if (isDownloadCompleted) {
          return;
        }
      }

      if (downloadModel.modFileUrl.includes('mega.nz')) {
        const file = File.fromURL(downloadModel.modFileUrl);
        await file.loadAttributes();

        const downloadStream = file.download({}, (err, data) => {
          if (err) {
            event.sender.send('download-mod-error', 1);
          }

          if (data) {
            writeFileSync(path.join(ankiTempDownloadDir, file.name as string), data as any);
            event.sender.send('download-mod-progress-completed', {
              percent: 100,
              transferredBytes: file.size,
              totalBytes: file.size,
            });
            event.sender.send('download-mod-completed', path.join(ankiTempDownloadDir, file.name as string));
          }
        });

        downloadStream.on('progress', (data: { bytesTotal: number; bytesLoaded: number }) => {
          event.sender.send('download-mod-progress', {
            percent: data.bytesLoaded / data.bytesTotal,
            transferredBytes: data.bytesLoaded,
            totalBytes: data.bytesTotal,
          });
        });

        return;
      }

      if (
        downloadModel.modFileUrl.startsWith('dev.sp-tarkov.com') ||
        downloadModel.modFileUrl.startsWith('hub.sp-tarkov.com/files/download') ||
        downloadModel.modFileUrl.startsWith('sp-tarkov.com/mod')
      ) {
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
      log.error(e);
      event.sender.send('download-mod-error', 1);
      await browser?.close();
    }
  });
};

async function handleDirectDownload(event: Electron.IpcMainEvent, ankiTempDownloadDir: string, downloadModel: DownloadModel) {
  const file = createWriteStream(path.join(ankiTempDownloadDir, `test.zip`));
  await axios({ url: downloadModel.modFileUrl, method: 'GET', responseType: 'stream' });

  file.on('finish', () => event.sender.send('download-mod-completed', file));
}

async function waitForDownload(downloadModel: DownloadModel, browser: Browser, event: Electron.IpcMainEvent, sptTempDownloadDir: string) {
  return new Promise<boolean>(async (resolve, reject) => {
    try {
      let guids: any = {};
      let downloadTimeoutId: any; // This will store the ID for the setTimeout call

      const page = await browser.newPage();
      const client = await page.createCDPSession();
      await client.send('Browser.setDownloadBehavior', { behavior: 'allowAndName', downloadPath: sptTempDownloadDir, eventsEnabled: true });

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
          renameSync(path.resolve(sptTempDownloadDir, progressEvent.guid), path.resolve(sptTempDownloadDir, guids[progressEvent.guid]));
          event.sender.send('download-mod-progress', {
            percent: 100,
            transferredBytes: progressEvent.receivedBytes,
            totalBytes: progressEvent.totalBytes,
          });
          event.sender.send('download-mod-completed', path.resolve(sptTempDownloadDir, guids[progressEvent.guid]));
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

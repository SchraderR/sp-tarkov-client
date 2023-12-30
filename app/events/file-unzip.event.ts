import { ipcMain } from 'electron';
import * as AdmZip from 'adm-zip';
import * as path from 'path';
import * as fs from 'fs';
import { ApplicationElectronFileError } from '../../src/app/core/events/electron.events';

export const handleFileUnzipEvent = () => {
  ipcMain.on('file-unzip', async (event, args: any) => {
    try {
      const ankiTempDownloadDir = path.join(args.akiInstancePath, '_temp');

      // TODO as standalone event
      if (!fs.existsSync(ankiTempDownloadDir)) {
        fs.mkdirSync(ankiTempDownloadDir);
      }

      const zip = new AdmZip(args.file.path);
      zip.getEntries().forEach(f => {
        if (f.entryName.indexOf('BepInEx/plugins/') === 0) {
          zip.extractEntryTo(f.entryName, args.akiInstancePath, true, true);
        }
        if (f.entryName.indexOf('user/mods/') === 0) {
          zip.extractEntryTo(f.entryName, args.akiInstancePath, true, true);
        }
      });

      // TODO as standalone event
      // if (fs.existsSync(ankiTempDownloadDir)) {
      //   fs.rmdirSync(ankiTempDownloadDir, { recursive: true });
      // }

      event.sender.send('file-unzip-completed');
    } catch (error) {
      // Handle error here. We're just logging and sending to the event.
      console.error(error);
      event.sender.send('file-unzip-error', ApplicationElectronFileError.unzipError);
    }
  });
};

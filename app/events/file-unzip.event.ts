import { ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { ApplicationElectronFileError } from '../../src/app/core/events/electron.events';
import * as sevenBin from '7zip-bin';
import { extractFull } from 'node-7z';
import { clientModPath, serverModPath } from '../shared/constants';

export const handleFileUnzipEvent = () => {
  ipcMain.on('file-unzip', async (event, args: any) => {
    try {
      const pathTo7zip = sevenBin.path7za;
      const ankiTempDownloadDir = path.join(args.akiInstancePath, '_temp');

      if (!fs.existsSync(ankiTempDownloadDir)) {
        fs.mkdirSync(ankiTempDownloadDir);
      }

      const archivePath = args.file.path;

      extractFull(archivePath, args.akiInstancePath, { $bin: pathTo7zip, $cherryPick: [`${clientModPath}/*`] })
        .on('end', () => console.log('Extraction done!'))
        .on('err', err => console.error(err));

      extractFull(archivePath, args.akiInstancePath, { $bin: pathTo7zip, $cherryPick: [`${serverModPath}/*`] })
        .on('end', () => console.log('Extraction done!'))
        .on('err', err => console.error(err));

      event.sender.send('file-unzip-completed');
    } catch (error) {
      console.error(error);
      event.sender.send('file-unzip-error', ApplicationElectronFileError.unzipError);
    }
  });
};

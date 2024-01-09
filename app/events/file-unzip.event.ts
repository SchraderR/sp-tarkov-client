import { ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as sevenBin from '7zip-bin';
import { extractFull, list } from 'node-7z';
import { clientModPath, serverModPath } from '../constants';
import { FileUnzipEvent } from '../../shared/models/unzip.model';

export const handleFileUnzipEvent = () => {
  ipcMain.on('file-unzip', async (event, args: FileUnzipEvent) => {
    try {
      const ankiTempDownloadDir = path.join(args.akiInstancePath, '_temp');

      if (!fs.existsSync(ankiTempDownloadDir)) {
        fs.mkdirSync(ankiTempDownloadDir);
      }

      const archivePath = args.filePath;
      console.log(archivePath);
      const isSingleDll = await checkForSingleDll(archivePath);
      if (isSingleDll) {
        await extractArchive(archivePath, path.join(args.akiInstancePath, clientModPath));
        event.sender.send('file-unzip-completed');
        return;
      }

      const clientModExtraction = extractArchive(archivePath, args.akiInstancePath, [`${clientModPath}/*`]);
      const serverModExtraction = extractArchive(archivePath, args.akiInstancePath, [`${serverModPath}/*`]);

      Promise.all([clientModExtraction, serverModExtraction])
        .then(() => event.sender.send('file-unzip-completed'))
        .catch(err => console.error(err));
    } catch (error) {
      console.error(error);
      // TODO Error Shared Mapping
      event.sender.send('file-unzip-error', 0);
    }
  });

  function checkForSingleDll(archivePath: string): Promise<boolean> {
    let dllFound = false;

    return new Promise(resolve => {
      list(archivePath, { $bin: sevenBin.path7za, $cherryPick: ['*.dll'] })
        .on('data', data => {
          if (!data.file.includes('/')) {
            dllFound = true;
          }
        })
        .on('end', () => resolve(dllFound));
    });
  }

  function extractArchive(path: string, dest: string, cherryPick?: any): Promise<void> {
    return new Promise((resolve, reject) => {
      extractFull(path, dest, { $bin: sevenBin.path7za, $cherryPick: cherryPick ?? [] })
        .on('end', resolve)
        .on('error', err => reject(err));
    });
  }
};

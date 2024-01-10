import { ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as sevenBin from '7zip-bin';
import { extractFull, list } from 'node-7z';
import { clientModPath, serverModPath } from '../constants';
import { FileUnzipEvent } from '../../shared/models/unzip.model';

export const handleFileUnzipEvent = (isServe: boolean) => {
  ipcMain.on('file-unzip', async (event, args: FileUnzipEvent) => {
    try {
      const sevenBinPath = isServe ? sevenBin.path7za : 'resources\\app.asar.unpacked\\node_modules\\7zip-bin\\win\\x64\\7za.exe';
      const ankiTempDownloadDir = path.join(args.akiInstancePath, '_temp');

      if (!fs.existsSync(ankiTempDownloadDir)) {
        fs.mkdirSync(ankiTempDownloadDir);
      }

      const archivePath = args.filePath;
      const isSingleDll = await checkForSingleDll(archivePath, sevenBinPath);
      if (isSingleDll) {
        await extractArchive(archivePath, path.join(args.akiInstancePath, clientModPath), sevenBinPath);
        event.sender.send('file-unzip-completed');
        return;
      }

      const clientModExtraction = extractArchive(archivePath, args.akiInstancePath, sevenBinPath, [`${clientModPath}/*`]);
      const serverModExtraction = extractArchive(archivePath, args.akiInstancePath, sevenBinPath, [`${serverModPath}/*`]);

      Promise.all([clientModExtraction, serverModExtraction])
        .then(() => event.sender.send('file-unzip-completed'))
        .catch(err => console.error(err));
    } catch (error) {
      console.error(error);
      // TODO Error Shared Mapping
      event.sender.send('file-unzip-error', 0);
    }
  });

  function checkForSingleDll(archivePath: string, sevenBinPath: string): Promise<boolean> {
    let dllFound = false;

    return new Promise(resolve => {
      list(archivePath, { $bin: sevenBinPath, $cherryPick: ['*.dll'] })
        .on('data', data => {
          console.log(data);
          if (!data.file.includes('/')) {
            dllFound = true;
          }
        })
        .on('end', () => resolve(dllFound));
    });
  }

  function extractArchive(path: string, dest: string, sevenBinPath: string, cherryPick?: any): Promise<void> {
    return new Promise((resolve, reject) => {
      extractFull(path, dest, { $bin: sevenBinPath, $cherryPick: cherryPick ?? [] })
        .on('end', resolve)
        .on('error', err => reject(err));
    });
  }
};

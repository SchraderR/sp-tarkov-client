import { ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { clientModPath, serverModPath } from '../constants';
import { FileUnzipEvent } from '../../shared/models/unzip.model';
import * as log from 'electron-log';
import { ZipArchiveHelper } from '../helper/zip-archive-helper';

export const handleFileUnzipEvent = () => {
  ipcMain.on('file-unzip', async (event, args: FileUnzipEvent) => {
    const ankiTempDownloadDir = path.join(args.akiInstancePath, '_temp');
    const archivePath = args.filePath;

    if (!fs.existsSync(ankiTempDownloadDir)) {
      fs.mkdirSync(ankiTempDownloadDir);
    }

    await handleArchive(archivePath, args, ankiTempDownloadDir, event);
  });
};

/**
 * Handles the extraction of files from an archive with various scenarios.
 *
 * @param {string} archivePath - The path of the archive to handle.
 * @param {boolean} isServe - Indicates whether the application is in serve mode.
 * @param {FileUnzipEvent} args - The event arguments for the file unzip.
 * @param {string} ankiTempDownloadDir - The temporary download directory for Anki.
 * @param {Electron.IpcMainEvent}*/
async function handleArchive(archivePath: string, args: FileUnzipEvent, ankiTempDownloadDir: string, event: Electron.IpcMainEvent) {
  try {
    const sevenBinPath = path.join(__dirname, '../public/7zip/7z.exe');
    const zipArchiveHelper = new ZipArchiveHelper();
    log.log(`----------------------------------`);
    log.log(`FileId:${args.hubId} - Start Unzip`);

    const isSingleDllResult = zipArchiveHelper.checkForSingleDll(archivePath, args);
    log.log(`FileId:${args.hubId} - isSingleDllResult: ${isSingleDllResult}`);
    if (isSingleDllResult) {
      event.sender.send('file-unzip-completed');
      return;
    }

    const isArchiveWithSingleDll = await zipArchiveHelper.checkForArchiveWithSingleDll(archivePath, sevenBinPath);
    log.log(`FileId:${args.hubId} - isArchiveWithSingleDll: ${isArchiveWithSingleDll}`);
    if (isArchiveWithSingleDll) {
      await zipArchiveHelper.extractFilesArchive(archivePath, path.join(args.akiInstancePath, clientModPath), sevenBinPath);
      event.sender.send('file-unzip-completed');
      return;
    }

    const isArchiveWithSingleDllInsideDirectory = await zipArchiveHelper.checkForArchiveWithSingleDllInsideDirectory(archivePath, sevenBinPath);
    log.log(`FileId:${args.hubId} - isArchiveWithSingleDllInsideDirectory: ${isArchiveWithSingleDllInsideDirectory}`);
    if (isArchiveWithSingleDllInsideDirectory) {
      await zipArchiveHelper.extractFilesArchive(archivePath, path.join(args.akiInstancePath, clientModPath), sevenBinPath, ['**\\*.dll'], true);
      event.sender.send('file-unzip-completed');
      return;
    }

    const isHappyPath = await zipArchiveHelper.isHappyPathArchive(archivePath, sevenBinPath);
    log.log(`FileId:${args.hubId} - isHappyPath: ${isHappyPath}`);
    if (isHappyPath) {
      await zipArchiveHelper.extractFullArchive(archivePath, args.akiInstancePath, sevenBinPath, [`${clientModPath}/*`, `${serverModPath}/*`]);
      event.sender.send('file-unzip-completed');
      return;
    }

    const isNestedServerModHappyPath = await zipArchiveHelper.determineNestedServerModHappyPath(archivePath, sevenBinPath);
    log.log(`FileId:${args.hubId} - isNestedServerModHappyPath: ${isNestedServerModHappyPath}`);
    if (isNestedServerModHappyPath) {
      await zipArchiveHelper.extractFullArchive(archivePath, ankiTempDownloadDir, sevenBinPath);
      fs.cpSync(`${ankiTempDownloadDir}/${isNestedServerModHappyPath}`, args.akiInstancePath, { recursive: true });
      event.sender.send('file-unzip-completed');
      return;
    }

    const isServerMod = await zipArchiveHelper.determineServerMod(archivePath, sevenBinPath);
    const isClientMod = await zipArchiveHelper.determineClientMod(archivePath, sevenBinPath);
    log.log(`FileId:${args.hubId} - isServerMod: ${isServerMod}`);
    log.log(`FileId:${args.hubId} - isClientMod: ${isClientMod}`);

    const isServerModWithDirectory = await zipArchiveHelper.checkForLeadingDirectoryServerMod(archivePath, sevenBinPath);
    log.log(`FileId:${args.hubId} - isServerModWithDirectory: ${isServerModWithDirectory}`);
    if (isServerModWithDirectory) {
      await zipArchiveHelper.extractFullArchive(archivePath, path.join(args.akiInstancePath, serverModPath), sevenBinPath);
      event.sender.send('file-unzip-completed');
      return;
    }

    // const clientModExtraction = extractArchive(archivePath, args.akiInstancePath, sevenBinPath, [`${clientModPath}/*`]);
    // const serverModExtraction = extractArchive(archivePath, args.akiInstancePath, sevenBinPath, [`${serverModPath}/*`]);
    // Promise.all([clientModExtraction, serverModExtraction])
    //   .then(([clientResult, serverResult]) => {
    //     if (clientResult || serverResult) {
    //       event.sender.send('file-unzip-completed');
    //     } else if (!clientResult && !serverResult) {
    //       event.sender.send('file-unzip-error', 3);
    //     }
    //   })
    //   .catch(err => console.error(err));

    //if (!isHappyPath) {
    //  switch (args.kind) {
    //    case 'client':
    //      await extractArchive(archivePath, path.join(args.akiInstancePath, clientModPath), sevenBinPath);
    //      break;
    //    case 'server':
    //      await extractArchive(archivePath, path.join(args.akiInstancePath, serverModPath), sevenBinPath);
    //      break;
    //
    //    case undefined:
    //      const isClientMod = await checkForClientMod(archivePath, sevenBinPath);
    //      const isServerMod = await checkForServerMod(archivePath, sevenBinPath);
    //
    //      if (isClientMod) {
    //        await extractArchive(archivePath, path.join(args.akiInstancePath, clientModPath), sevenBinPath);
    //      } else if (isServerMod) {
    //        await extractArchive(archivePath, path.join(args.akiInstancePath, serverModPath), sevenBinPath);
    //      }
    //
    //      if (!isClientMod && !isServerMod) {
    //        event.sender.send('file-unzip-error', 3);
    //        throw new Error();
    //      }
    //      break;
    //  }
    //  event.sender.send('file-unzip-completed');
    //  return;
    //}
    log.error(`FileId:${args.hubId} - No unzip event found`);
    event.sender.send('file-unzip-error', 2);
  } catch (error) {
    log.error(error);
    console.error(error);
    event.sender.send('file-unzip-error', 2);
  }
}

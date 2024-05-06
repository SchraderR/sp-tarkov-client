import { ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { clientModPath, serverModPath } from '../constants';
import { FileUnzipEvent } from '../../shared/models/unzip.model';
import * as log from 'electron-log';
import { ZipArchiveHelper } from '../helper/zip-archive-helper';

export const handleFileUnzipEvent = (isServe: boolean) => {
  ipcMain.on('file-unzip', async (event, args: FileUnzipEvent) => {
    const ankiTempDownloadDir = path.join(args.akiInstancePath, '_temp');
    const archivePath = args.filePath;

    if (!fs.existsSync(ankiTempDownloadDir)) {
      fs.mkdirSync(ankiTempDownloadDir);
    }

    if (!fs.existsSync(archivePath)) {
      event.sender.send('file-unzip-error', 2);
      return;
    }

    await handleArchive(archivePath, args, ankiTempDownloadDir, isServe, event);
  });
};

/**
 * Handles the archive file by performing various extraction operations based on the file content and arguments.
 *
 * @param {string} archivePath - The path of the archive file to handle.
 * @param {FileUnzipEvent} args - The arguments for handling the archive file.
 * @param {string} ankiTempDownloadDir - The temporary download directory for Anki.
 * @param {boolean} isServe - Specifies if the handleArchive method is invoked by the server.
 * @param {Electron.IpcMainEvent} event - The event object for communicating with the main process.
 */
async function handleArchive(archivePath: string, args: FileUnzipEvent, ankiTempDownloadDir: string, isServe: boolean, event: Electron.IpcMainEvent) {
  try {
    const sevenBinPath = isServe ? path.join(__dirname, '../public/7zip/7z.exe') : path.join(process.resourcesPath, 'app/public/7zip/7z.exe');

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

    const isServerModWithDirectory = await zipArchiveHelper.checkForLeadingDirectoryServerMod(archivePath, sevenBinPath);
    log.log(`FileId:${args.hubId} - isServerModWithDirectory: ${isServerModWithDirectory}`);
    if (isServerModWithDirectory) {
      await zipArchiveHelper.extractFullArchive(archivePath, path.join(args.akiInstancePath, serverModPath), sevenBinPath);
      event.sender.send('file-unzip-completed');
      return;
    }

    const isServerMod = await zipArchiveHelper.determineServerMod(archivePath, sevenBinPath);
    const isClientMod = await zipArchiveHelper.determineClientMod(archivePath, sevenBinPath);
    log.log(`FileId:${args.hubId} - isServerMod: ${isServerMod}`);
    log.log(`FileId:${args.hubId} - isClientMod: ${isClientMod}`);

    // export const clientModPath = 'BepInEx/plugins';
    // export const serverModPath = 'user/mods';

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

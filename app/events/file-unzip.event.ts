import { ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { clientPatcherModPath, clientPluginModPath, serverModPath } from '../constants';
import { FileUnzipEvent } from '../../shared/models/unzip.model';
import { ZipArchiveHelper } from '../helper/zip-archive-helper';
import { error, log } from 'electron-log';
import * as Store from 'electron-store';
import { UserSettingStoreModel } from '../../shared/models/user-setting.model';

export const handleFileUnzipEvent = (isServe: boolean, store: Store<UserSettingStoreModel>) => {
  ipcMain.on('file-unzip', async (event, args: FileUnzipEvent) => {
    const ankiTempDownloadDir = path.join(args.sptInstancePath, '_temp');
    const archivePath = args.filePath;

    if (!fs.existsSync(ankiTempDownloadDir)) {
      fs.mkdirSync(ankiTempDownloadDir);
    }

    if (!fs.existsSync(archivePath)) {
      event.sender.send('file-unzip-error', 2);
      return;
    }

    await handleArchive(archivePath, args, ankiTempDownloadDir, isServe, event, store);
  });
};

/**
 * Handles the extraction of an archive file based on the provided parameters and conditions.
 *
 * @param {string} archivePath - The path to the archive file.
 * @param {FileUnzipEvent} args - The event arguments containing details related to file unzipping.
 * @param {string} ankiTempDownloadDir - The temporary directory for downloaded files.
 * @param {boolean} isServe - A flag indicating if the operation is being performed in server mode.
 * @param {Electron.IpcMainEvent} event - The IPC event to communicate back results or errors.
 * @param {Store<UserSettingStoreModel>} store - The store containing user settings.
 *
 * @return {Promise<void>} A promise that resolves when the archive handling is complete.
 */
async function handleArchive(
  archivePath: string,
  args: FileUnzipEvent,
  ankiTempDownloadDir: string,
  isServe: boolean,
  event: Electron.IpcMainEvent,
  store: Store<UserSettingStoreModel>
): Promise<void> {
  try {
    const sevenBinPath = isServe
      ? 'app\\node_modules\\node-7z-archive\\binaries\\win32\\7z.exe'
      : 'resources\\app.asar.unpacked\\node_modules\\node-7z-archive\\binaries\\win32\\7z.exe';

    const zipArchiveHelper = new ZipArchiveHelper(store, args.sptInstancePath);
    log(`----------------------------------`);
    log(`FileId:${args.hubId} - Start Unzip`);

    const isSingleDllResult = zipArchiveHelper.checkForSingleDll(archivePath, args, args.hubId);
    log(`FileId:${args.hubId} - isSingleDllResult: ${isSingleDllResult}`);
    if (isSingleDllResult) {
      event.sender.send('file-unzip-completed');
      return;
    }

    const isArchiveWithSingleDll = await zipArchiveHelper.checkForArchiveWithSingleDll(archivePath, sevenBinPath);
    log(`FileId:${args.hubId} - isArchiveWithSingleDll: ${isArchiveWithSingleDll}`);
    if (isArchiveWithSingleDll) {
      await zipArchiveHelper.extractFilesArchive(
        archivePath,
        path.join(args.sptInstancePath, clientPluginModPath),
        sevenBinPath,
        args.hubId,
        args.sptInstancePath
      );
      event.sender.send('file-unzip-completed');
      return;
    }

    const isArchiveWithSingleDllInsideDirectory = await zipArchiveHelper.checkForArchiveWithSingleDllInsideDirectory(archivePath, sevenBinPath);
    log(`FileId:${args.hubId} - isArchiveWithSingleDllInsideDirectory: ${isArchiveWithSingleDllInsideDirectory}`);
    if (isArchiveWithSingleDllInsideDirectory) {
      await zipArchiveHelper.extractFilesArchive(
        archivePath,
        path.join(args.sptInstancePath, clientPluginModPath),
        sevenBinPath,
        args.hubId,
        ['**\\*.dll'],
        true
      );
      event.sender.send('file-unzip-completed');
      return;
    }

    const isHappyPath = await zipArchiveHelper.isHappyPathArchive(archivePath, sevenBinPath);
    log(`FileId:${args.hubId} - isHappyPath: ${isHappyPath}`);
    if (isHappyPath) {
      await zipArchiveHelper.extractFullArchive(archivePath, args.sptInstancePath, sevenBinPath, args.hubId, [
        `${clientPatcherModPath}/*`,
        `${clientPluginModPath}/*`,
        `${serverModPath}/*`,
      ]);
      event.sender.send('file-unzip-completed');
      return;
    }

    const isNestedServerModHappyPath = await zipArchiveHelper.determineNestedServerModHappyPath(archivePath, sevenBinPath);
    log(`FileId:${args.hubId} - isNestedServerModHappyPath: ${isNestedServerModHappyPath}`);
    if (isNestedServerModHappyPath) {
      await zipArchiveHelper.extractFullArchive(archivePath, ankiTempDownloadDir, sevenBinPath, args.hubId, args.sptInstancePath);
      fs.cpSync(`${ankiTempDownloadDir}/${isNestedServerModHappyPath}/${serverModPath}`, path.join(args.sptInstancePath, serverModPath), {
        recursive: true,
      });
      event.sender.send('file-unzip-completed');
      return;
    }

    const isServerModWithDirectory = await zipArchiveHelper.checkForLeadingDirectoryServerMod(archivePath, sevenBinPath);
    log(`FileId:${args.hubId} - isServerModWithDirectory: ${isServerModWithDirectory}`);
    if (isServerModWithDirectory) {
      await zipArchiveHelper.extractFullArchive(archivePath, path.join(args.sptInstancePath, serverModPath), sevenBinPath, args.hubId);
      event.sender.send('file-unzip-completed');
      return;
    }

    const isServerMod = await zipArchiveHelper.determineServerMod(archivePath, sevenBinPath);
    const isClientMod = await zipArchiveHelper.determineClientMod(archivePath, sevenBinPath);
    log(`FileId:${args.hubId} - isServerMod: ${isServerMod}`);
    log(`FileId:${args.hubId} - isClientMod: ${isClientMod}`);

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
    error(`FileId:${args.hubId} - No unzip event found`);
    event.sender.send('file-unzip-error', 2);
  } catch (e) {
    error(e);
    event.sender.send('file-unzip-error', 2);
  }
}

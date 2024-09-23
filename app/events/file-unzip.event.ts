import { app, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { clientPatcherModPath, clientPluginModPath, serverModPath } from '../constants';
import { FileUnzipEvent } from '../../shared/models/unzip.model';
import { ZipArchiveHelper } from '../helper/zip-archive-helper';
import { error, log } from 'electron-log';
import * as Store from 'electron-store';
import { UserSettingStoreModel } from '../../shared/models/user-setting.model';
import { ModTrackingHelper } from '../helper/mod-tracking-helper';
import { ensureDirSync } from 'fs-extra';

export const handleFileUnzipEvent = (isServe: boolean, store: Store<UserSettingStoreModel>) => {
  ipcMain.on('file-unzip', async (event, args: FileUnzipEvent) => {
    const tempDownloadDir = path.join(args.instancePath, '_temp');
    const archivePath = args.filePath;

    const appPath = app.getPath('userData');
    const instanceName = args.instancePath.split('\\').pop();
    if (!instanceName) {
      error('Instance name cannot be fetched');
      event.sender.send('toggle-mod-state-error');
      return;
    }
    const instanceModPath = path.join(appPath, 'instances', instanceName, 'mods');
    ensureDirSync(instanceModPath);
    console.log(instanceModPath);

    if (!fs.existsSync(tempDownloadDir)) {
      fs.mkdirSync(tempDownloadDir);
    }

    if (!fs.existsSync(archivePath)) {
      event.sender.send('file-unzip-error', 2);
      return;
    }

    await handleArchive(archivePath, args, tempDownloadDir, isServe, event, store, instanceModPath);
  });
};

/**
 * Handles the unzipping and processing of archive files based on the provided criteria and conditions.
 *
 * @param {string} archivePath - The file path of the archive to be processed.
 * @param {FileUnzipEvent} args - Event arguments including details about the file and its processing requirements.
 * @param {string} tempDownloadDir - Temporary directory for downloading Anki files.
 * @param {boolean} isServe - Flag indicating whether the function is being executed in a serve mode.
 * @param {Electron.IpcMainEvent} event - IPC event used to communicate back to the main process.
 * @param {Store<UserSettingStoreModel>} store - The store containing user settings.
 * @return {Promise<void>} A promise that resolves when the archive handling is complete.
 */
async function handleArchive(
  archivePath: string,
  args: FileUnzipEvent,
  tempDownloadDir: string,
  isServe: boolean,
  event: Electron.IpcMainEvent,
  store: Store<UserSettingStoreModel>,
  instanceModPath: string
): Promise<void> {
  try {
    const modTrackingHelper = new ModTrackingHelper(store);
    const sevenBinPath = isServe
      ? 'app\\node_modules\\node-7z-archive\\binaries\\win32\\7z.exe'
      : 'resources\\app.asar.unpacked\\node_modules\\node-7z-archive\\binaries\\win32\\7z.exe';

    const zipArchiveHelper = new ZipArchiveHelper();
    log(`----------------------------------`);
    log(`HubId:${args.hubId} - Start Unzip`);

    const isSingleDllResult = zipArchiveHelper.checkForSingleDll(archivePath, args);
    log(`HubId:${args.hubId} - isSingleDllResult: ${isSingleDllResult}`);
    if (isSingleDllResult) {
      modTrackingHelper.trackMod(args, path.join(instanceModPath, args.hubId));
      event.sender.send('file-unzip-completed');
      return;
    }

    const isArchiveWithSingleDll = await zipArchiveHelper.checkForArchiveWithSingleDll(archivePath, sevenBinPath);
    log(`HubId:${args.hubId} - isArchiveWithSingleDll: ${isArchiveWithSingleDll}`);
    if (isArchiveWithSingleDll) {
      await zipArchiveHelper.extractFilesArchive(archivePath, path.join(instanceModPath, args.hubId), sevenBinPath, args);
      modTrackingHelper.trackMod(args, path.join(instanceModPath, args.hubId));
      event.sender.send('file-unzip-completed');
      return;
    }

    const isArchiveWithSingleDllInsideDirectory = await zipArchiveHelper.checkForArchiveWithSingleDllInsideDirectory(archivePath, sevenBinPath);
    log(`HubId:${args.hubId} - isArchiveWithSingleDllInsideDirectory: ${isArchiveWithSingleDllInsideDirectory}`);
    if (isArchiveWithSingleDllInsideDirectory) {
      await zipArchiveHelper.extractFilesArchive(archivePath, path.join(instanceModPath, args.hubId), sevenBinPath, ['**\\*.dll']);
      modTrackingHelper.trackMod(args, path.join(instanceModPath, args.hubId));
      event.sender.send('file-unzip-completed');
      return;
    }

    const isHappyPath = await zipArchiveHelper.isHappyPathArchive(archivePath, sevenBinPath);
    log(`HubId:${args.hubId} - isHappyPath: ${isHappyPath}`);
    if (isHappyPath) {
      await zipArchiveHelper.extractFullArchive(archivePath, path.join(instanceModPath, args.hubId), sevenBinPath, [
        `${clientPatcherModPath}/*`,
        `${clientPluginModPath}/*`,
        `${serverModPath}/*`,
      ]);

      modTrackingHelper.trackMod(args, path.join(instanceModPath, args.hubId));
      event.sender.send('file-unzip-completed');
      return;
    }

    const isNestedServerModHappyPath = await zipArchiveHelper.determineNestedServerModHappyPath(archivePath, sevenBinPath);
    log(`HubId:${args.hubId} - isNestedServerModHappyPath: ${isNestedServerModHappyPath}`);
    if (isNestedServerModHappyPath) {
      await zipArchiveHelper.extractFullArchive(archivePath, tempDownloadDir, sevenBinPath, args);
      fs.cpSync(`${tempDownloadDir}/${isNestedServerModHappyPath}/${serverModPath}`, path.join(instanceModPath, args.hubId), {
        recursive: true,
      });

      modTrackingHelper.trackMod(args, path.join(instanceModPath, args.hubId));
      event.sender.send('file-unzip-completed');
      return;
    }

    const isServerModWithDirectory = await zipArchiveHelper.checkForLeadingDirectoryServerMod(archivePath, sevenBinPath);
    log(`HubId:${args.hubId} - isServerModWithDirectory: ${isServerModWithDirectory}`);
    if (isServerModWithDirectory) {
      await zipArchiveHelper.extractFullArchive(archivePath, path.join(instanceModPath, args.hubId), sevenBinPath, args);
      modTrackingHelper.trackMod(args, path.join(instanceModPath, args.hubId));
      event.sender.send('file-unzip-completed');
      return;
    }

    // const isServerMod = await zipArchiveHelper.determineServerMod(archivePath, sevenBinPath);
    // const isClientMod = await zipArchiveHelper.determineClientMod(archivePath, sevenBinPath);
    // log(`HubId:${args.hubId} - isServerMod: ${isServerMod}`);
    // log(`HubId:${args.hubId} - isClientMod: ${isClientMod}`);

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
    error(`HubId:${args.hubId} - No unzip event found`);
    event.sender.send('file-unzip-error', 2);
  } catch (e) {
    error(e);
    event.sender.send('file-unzip-error', 2);
  }
}

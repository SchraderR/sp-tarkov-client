import { ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as sevenBin from '7zip-bin';
import * as unrar from 'node-unrar-js';
import { Extractor } from 'node-unrar-js';
import { clientModPath, serverModPath } from '../constants';
import { FileUnzipEvent } from '../../shared/models/unzip.model';
import * as log from 'electron-log';
import { ZipArchiveHelper } from '../helper/zip-archive-helper';

export const handleFileUnzipEvent = (isServe: boolean) => {
  ipcMain.on('file-unzip', async (event, args: FileUnzipEvent) => {
    try {
      // TODO OUTSOUCE
      // Checking if the _temp download directory exists
      const ankiTempDownloadDir = path.join(args.akiInstancePath, '_temp');
      const archivePath = args.filePath;

      if (!fs.existsSync(ankiTempDownloadDir)) {
        fs.mkdirSync(ankiTempDownloadDir);
      }

      const isRarArchive = archivePath.endsWith('.rar');
      if (isRarArchive) {
        await handleRarArchive(archivePath, args, event);
      } else {
        await handleOtherArchive(archivePath, isServe, args, ankiTempDownloadDir, event);
      }
    } catch (error) {
      log.error(error);
      console.error(error);
      event.sender.send('file-unzip-error', 3);
    }
  });
};

async function handleRarArchive(archivePath: string, args: FileUnzipEvent, event: Electron.IpcMainEvent) {
  try {
    // export const clientModPath = 'BepInEx/plugins'; DLL
    // export const serverModPath = 'user/mods'; package.json
    archivePath = 'F:\\EFT_SP_Playground\\_temp\\test.rar'; // server without happy path

    const extractorForFiles = await unrar.createExtractorFromFile({ filepath: archivePath });
    console.log('rar');

    const isRarServerMod = await determineRarServerMod(extractorForFiles);
    console.log('isRarServerMod', isRarServerMod);

    // place
    // place
    // place

    // const isRarArchiveWithSingleDll = await checkForRarWithSingleDll(extractorForFiles);
    // console.log('isRarArchiveWithSingleDll', isRarArchiveWithSingleDll);
    // if (isRarArchiveWithSingleDll) {
    //   const extractorForDll = await unrar.createExtractorFromFile({
    //     filepath: archivePath,
    //     targetPath: path.join(args.akiInstancePath, clientModPath),
    //   });
    //   extractorForDll.extract();
    //   event.sender.send('file-unzip-completed');
    //   return;
    // }

    // const isRarWithSingleDll = await checkForRarWithSingleDll(extractorForFiles);
    // if (isRarWithSingleDll) {
    //   const extractorForDll = await unrar.createExtractorFromFile({
    //     filepath: archivePath,
    //     targetPath: path.join(args.akiInstancePath, clientModPath),
    //   });
    //   extractorForDll.extract();
    //   event.sender.send('file-unzip-completed');
    //   return;
    // }
    //
    // const isRarHappyPath = await isHappyPathRar(extractorForFiles);
    // if (!isRarHappyPath) {
    //   switch (args.kind) {
    //     case 'client':
    //       const extractorForClient = await unrar.createExtractorFromFile({
    //         filepath: archivePath,
    //         targetPath: path.join(args.akiInstancePath, clientModPath),
    //       });
    //       const clientFiles = extractorForClient.extract().files;
    //       for (const file of clientFiles) {
    //       } // this extracts the files. wtf
    //       break;
    //     case 'server':
    //       const extractorForServer = await unrar.createExtractorFromFile({
    //         filepath: archivePath,
    //         targetPath: path.join(args.akiInstancePath, serverModPath),
    //       });
    //       const serverFiles = extractorForServer.extract().files;
    //       for (const file of serverFiles) {
    //       } // this extracts the files. wtf
    //       break;
    //     default:
    //       event.sender.send('file-unzip-error', 3);
    //       break;
    //   }
    //   event.sender.send('file-unzip-completed');
    //  return;
    //}

    // if (isRarHappyPath) {
    //   const extractorForHappyPath = await unrar.createExtractorFromFile({
    //     filepath: archivePath,
    //     targetPath: args.akiInstancePath,
    //   });
    //   const files = extractorForHappyPath.extract().files;
    //   for (const file of files) {
    //   } // this extracts the files. wtf
    // }

    event.sender.send('file-unzip-completed');
    return;
  } catch (e) {
    event.sender.send('file-unzip-error', 3);
  }
}

// new functions
function determineRarClientMod(extractor: Extractor): Promise<boolean> {
  let isClientMod = false;

  return new Promise(resolve => {
    const extracted = extractor.getFileList();
    const files = [...extracted.fileHeaders];

    files.forEach(file => {
      console.log(file);
      if (file.name.endsWith('.dll') && !file.name.includes('/')) {
        isClientMod = true;
      }
    });

    resolve(isClientMod);
  });
}
function determineRarServerMod(extractor: Extractor): Promise<boolean> {
  let isServerMod = false;

  return new Promise(resolve => {
    const extracted = extractor.getFileList();
    const files = [...extracted.fileHeaders];

    files.forEach(file => {
      console.log(file);
      if (file.name.endsWith('package.json') && !file.name.includes('/')) {
        isServerMod = true;
      }
    });

    resolve(isServerMod);
  });
}
function checkForRarWithSingleDll(extractor: Extractor): Promise<boolean> {
  let dllFound = false;

  return new Promise(resolve => {
    const extracted = extractor.getFileList();
    const files = [...extracted.fileHeaders];

    files.forEach(file => {
      if (file.name.endsWith('.dll') && !file.name.includes('/')) {
        dllFound = true;
      }
    });

    resolve(dllFound);
  });
}
// old
function isHappyPathRar(extractorForFiles: Extractor) {
  let isHappyPath = false;

  return new Promise((resolve, reject) => {
    const extracted = extractorForFiles.getFileList();
    const files = [...extracted.fileHeaders];

    files.forEach(file => {
      if (file.name.startsWith(clientModPath) || file.name.startsWith(serverModPath)) {
        isHappyPath = true;
      }
    });

    resolve(isHappyPath);
  });
}

// other archives
// other archives
// other archives
// other archives
async function handleOtherArchive(
  archivePath: string,
  isServe: boolean,
  args: FileUnzipEvent,
  ankiTempDownloadDir: string,
  event: Electron.IpcMainEvent
) {
  const sevenBinPath = isServe ? sevenBin.path7za : 'resources\\app.asar.unpacked\\node_modules\\7zip-bin\\win\\x64\\7za.exe';
  const zipArchiveHelper = new ZipArchiveHelper();

  // check for single dll file and send result or continue
  // mod to test -> https://hub.sp-tarkov.com/files/file/1453-that-s-lit/
  const isSingleDllResult = zipArchiveHelper.checkForSingleDll(archivePath, args);
  if (isSingleDllResult) {
    event.sender.send('file-unzip-completed');
    return;
  }

  // test ->
  const isArchiveWithSingleDll = await zipArchiveHelper.checkForArchiveWithSingleDll(archivePath, sevenBinPath);
  console.log('isArchiveWithSingleDll', isArchiveWithSingleDll);
  if (isArchiveWithSingleDll) {
    await zipArchiveHelper.extractFilesArchive(archivePath, path.join(args.akiInstancePath, clientModPath), sevenBinPath);
    event.sender.send('file-unzip-completed');
    return;
  }

  // case: single dll in a directory
  // https://hub.sp-tarkov.com/files/file/1474-samswat-s-increased-fov-reupload
  const isArchiveWithSingleDllInsideDirectory = await zipArchiveHelper.checkForArchiveWithSingleDllInsideDirectory(archivePath, sevenBinPath);
  console.log('isArchiveWithSingleDllInsideDirectory', isArchiveWithSingleDllInsideDirectory);
  if (isArchiveWithSingleDllInsideDirectory) {
    await zipArchiveHelper.extractFilesArchive(archivePath, path.join(args.akiInstancePath, clientModPath), sevenBinPath, ['**\\*.dll'], true);
    event.sender.send('file-unzip-completed');
    return;
  }

  // case: mod with happy path
  // test -> https://hub.sp-tarkov.com/files/file/606-spt-realism-mod/
  const isHappyPath = await zipArchiveHelper.isHappyPathArchive(archivePath, sevenBinPath);
  console.log('isHappyPath', isHappyPath);
  if (isHappyPath) {
    await zipArchiveHelper.extractFullArchive(archivePath, args.akiInstancePath, sevenBinPath, [`${clientModPath}/*`, `${serverModPath}/*`]);
    event.sender.send('file-unzip-completed');
    return;
  }

  // TODO test against normal mods
  const nestedServerModHappyPath = await zipArchiveHelper.determineNestedServerModHappyPath(archivePath, sevenBinPath);
  console.log('isNestedServerModHappyPath', nestedServerModHappyPath);
  if (nestedServerModHappyPath) {
    await zipArchiveHelper.extractFullArchive(archivePath, ankiTempDownloadDir, sevenBinPath);
    fs.cpSync(`${ankiTempDownloadDir}/${nestedServerModHappyPath}`, args.akiInstancePath, { recursive: true });
    event.sender.send('file-unzip-completed');
    return;
  }

  // export const clientModPath = 'BepInEx/plugins'; DLL
  // export const serverModPath = 'user/mods'; package.json
  const isServerMod = await zipArchiveHelper.determineServerMod(archivePath, sevenBinPath);
  const isClientMod = await zipArchiveHelper.determineClientMod(archivePath, sevenBinPath);
  console.log('isServerMod', isServerMod);
  console.log('isClientMod', isClientMod);

  const isServerModWithDirectory = await zipArchiveHelper.checkForLeadingDirectoryServerMod(archivePath, sevenBinPath);
  console.log('isServerModWithDirectory', isServerModWithDirectory);
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
}

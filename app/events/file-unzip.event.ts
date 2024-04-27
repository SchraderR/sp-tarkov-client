import { ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as sevenBin from '7zip-bin';
import * as unrar from 'node-unrar-js';
import { Extractor } from 'node-unrar-js';
import { extract, extractFull, list } from 'node-7z';
import { clientModPath, serverModPath } from '../constants';
import { FileUnzipEvent } from '../../shared/models/unzip.model';
import * as log from 'electron-log';

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

      // check for single dll file and send result or continue
      // mod to test -> https://hub.sp-tarkov.com/files/file/1453-that-s-lit/
      const isSingleDllResult = checkForSingleDll(archivePath, args);
      if (isSingleDllResult) {
        event.sender.send('file-unzip-completed');
        return;
      }
      // sad
      // sad
      // sad
      // sad
      // sad

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
  //try {
  //  const extractorForFiles = await unrar.createExtractorFromFile({ filepath: archivePath });
  //
  //  const isRarWithSingleDll = await checkForRarWithSingleDll(extractorForFiles);
  //  if (isRarWithSingleDll) {
  //    const extractorForDll = await unrar.createExtractorFromFile({
  //      filepath: archivePath,
  //      targetPath: path.join(args.akiInstancePath, clientModPath),
  //    });
  //    extractorForDll.extract();
  //    event.sender.send('file-unzip-completed');
  //    return;
  //  }
  //
  //  const isRarHappyPath = await isHappyPathRar(extractorForFiles);
  //  if (!isRarHappyPath) {
  //    switch (args.kind) {
  //      case 'client':
  //        const extractorForClient = await unrar.createExtractorFromFile({
  //          filepath: archivePath,
  //          targetPath: path.join(args.akiInstancePath, clientModPath),
  //        });
  //        const clientFiles = extractorForClient.extract().files;
  //        for (const file of clientFiles) {
  //        } // this extracts the files. wtf
  //        break;
  //      case 'server':
  //        const extractorForServer = await unrar.createExtractorFromFile({
  //          filepath: archivePath,
  //          targetPath: path.join(args.akiInstancePath, serverModPath),
  //        });
  //        const serverFiles = extractorForServer.extract().files;
  //        for (const file of serverFiles) {
  //        } // this extracts the files. wtf
  //        break;
  //      default:
  //        event.sender.send('file-unzip-error', 3);
  //        break;
  //    }
  //    event.sender.send('file-unzip-completed');
  //    return;
  //  }
  //
  //  if (isRarHappyPath) {
  //    const extractorForHappyPath = await unrar.createExtractorFromFile({
  //      filepath: archivePath,
  //      targetPath: args.akiInstancePath,
  //    });
  //    const files = extractorForHappyPath.extract().files;
  //    for (const file of files) {
  //    } // this extracts the files. wtf
  //  }
  //
  //  event.sender.send('file-unzip-completed');
  //  return;
  //} catch (e) {
  //  event.sender.send('file-unzip-error', 3);
  //}
}

async function handleOtherArchive(
  archivePath: string,
  isServe: boolean,
  args: FileUnzipEvent,
  ankiTempDownloadDir: string,
  event: Electron.IpcMainEvent
) {
  const sevenBinPath = isServe ? sevenBin.path7za : 'resources\\app.asar.unpacked\\node_modules\\7zip-bin\\win\\x64\\7za.exe';

  // test ->
  const isArchiveWithSingleDll = await checkForArchiveWithSingleDll(archivePath, sevenBinPath);
  console.log('isArchiveWithSingleDll', isArchiveWithSingleDll);
  if (isArchiveWithSingleDll) {
    await extractFilesArchive(archivePath, path.join(args.akiInstancePath, clientModPath), sevenBinPath);
    event.sender.send('file-unzip-completed');
    return;
  }

  // case: single dll in a directory
  // https://hub.sp-tarkov.com/files/file/1474-samswat-s-increased-fov-reupload
  const isArchiveWithSingleDllInsideDirectory = await checkForArchiveWithSingleDllInsideDirectory(archivePath, sevenBinPath);
  console.log('isArchiveWithSingleDllInsideDirectory', isArchiveWithSingleDllInsideDirectory);
  if (isArchiveWithSingleDllInsideDirectory) {
    await extractFilesArchive(archivePath, path.join(args.akiInstancePath, clientModPath), sevenBinPath, ['**\\*.dll'], true);
    event.sender.send('file-unzip-completed');
    return;
  }

  // case: mod with happy path
  // test -> https://hub.sp-tarkov.com/files/file/606-spt-realism-mod/
  const isHappyPath = await isHappyPathArchive(archivePath, sevenBinPath);
  console.log('isHappyPath', isHappyPath);
  if (isHappyPath) {
    await extractFullArchive(archivePath, args.akiInstancePath, sevenBinPath, [`${clientModPath}/*`, `${serverModPath}/*`]);
    event.sender.send('file-unzip-completed');
    return;
  }

  // TODO test against normal mods
  const nestedServerModHappyPath = await determineNestedServerModHappyPath(archivePath, sevenBinPath);
  console.log('isNestedServerModHappyPath', nestedServerModHappyPath);
  if (nestedServerModHappyPath) {
    await extractFullArchive(archivePath, ankiTempDownloadDir, sevenBinPath);
    fs.cpSync(`${ankiTempDownloadDir}/${nestedServerModHappyPath}`, args.akiInstancePath, { recursive: true });
    event.sender.send('file-unzip-completed');
    return;
  }

  // export const clientModPath = 'BepInEx/plugins'; DLL
  // export const serverModPath = 'user/mods'; package.json
  const isServerMod = await determineServerMod(archivePath, sevenBinPath);
  const isClientMod = await determineClientMod(archivePath, sevenBinPath);
  console.log('isServerMod', isServerMod);
  console.log('isClientMod', isClientMod);

  const isServerModWithDirectory = await checkForLeadingDirectoryServerMod(archivePath, sevenBinPath);
  console.log('isServerModWithDirectory', isServerModWithDirectory);
  if (isServerModWithDirectory) {
    await extractFullArchive(archivePath, path.join(args.akiInstancePath, serverModPath), sevenBinPath);
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

function isRootDirectory(filePath: string): boolean {
  const parts = filePath.split('/');
  return parts.length <= 2;
}

// new stuff

function checkForLeadingDirectoryServerMod(path: string, sevenBinPath: string): Promise<boolean> {
  let serverModWithLeadingDirectory = false;

  return new Promise((resolve, reject) => {
    list(path, { $bin: sevenBinPath, $cherryPick: ['*\\package.json'], recursive: true })
      .on('data', data => {
        if (data.file.split('/')?.[1] === 'package.json') {
          serverModWithLeadingDirectory = true;
        }
      })
      .on('end', () => resolve(serverModWithLeadingDirectory))
      .on('error', reject);
  });
}

/**
 * Determines if a nested server module exists at the given path
 *
 * @param {string} path - The path to the directory to search for the nested server module.
 * @param {string} sevenBinPath - The path to the 7zip executable.
 * @returns {Promise<boolean>} - A promise that resolves with a boolean indicating if the nested server module exists.
 */
function determineNestedServerModHappyPath(path: string, sevenBinPath: string): Promise<string | null> {
  let nestedServerModName: string | null = null;
  return new Promise((resolve, reject) => {
    list(path, { $bin: sevenBinPath, $cherryPick: [`*\\${serverModPath}`] })
      .on('data', data => {
        if (data?.attributes?.[0] === 'D') {
          nestedServerModName = data.file.split(`${serverModPath}`)[0];
        }
      })
      .on('end', () => resolve(nestedServerModName))
      .on('error', reject);
  });
}

/**
 * Determines if a given path contains a server module.
 *
 * @param {string} path - The path to the directory to check.
 * @param {string} sevenBinPath - The path to the 7zip binary.
 * @returns {Promise<boolean>} - A promise that resolves with a boolean indicating if the directory is a server module.
 * @throws {Error} - If there is an error while determining the server module.
 */
function determineServerMod(path: string, sevenBinPath: string): Promise<boolean> {
  let isServerMod = false;
  return new Promise((resolve, reject) => {
    list(path, { $bin: sevenBinPath, $cherryPick: ['**\\package.json'], recursive: true })
      .on('data', data => (isServerMod = true))
      .on('end', () => resolve(isServerMod))
      .on('error', reject);
  });
}

/**
 * Determines if a client module exists in the given path.
 *
 * @param {string} path - The path to search for client modules.
 * @param {string} sevenBinPath - The path to the 7zip executable.
 * @returns {Promise<boolean>} A promise that resolves to true if a client module exists, false otherwise.
 */
function determineClientMod(path: string, sevenBinPath: string): Promise<boolean> {
  let isClientMod = false;
  return new Promise((resolve, reject) => {
    list(path, { $bin: sevenBinPath, $cherryPick: ['**\\*.dll'], recursive: true })
      .on('data', data => (isClientMod = isRootDirectory(data.file)))
      .on('end', () => resolve(isClientMod))
      .on('error', reject);
  });
}

/**
 * Determines if the given archive path has any files in the happy path
 *
 * @param {string} archivePath - The path of the archive to check.
 * @param {string} sevenBinPath - The path of the 7zip binary.
 * @returns {Promise<boolean>} - A promise that resolves to true if the archive has files, false otherwise.
 */
function isHappyPathArchive(archivePath: string, sevenBinPath: string): Promise<boolean> {
  let hasFiles = false;

  return new Promise((resolve, reject) => {
    list(archivePath, { $bin: sevenBinPath, $cherryPick: [`${clientModPath}/*`, `${serverModPath}/*`] })
      .on('data', () => (hasFiles = true))
      .on('end', () => resolve(hasFiles))
      .on('error', error => reject(error));
  });
}

/**
 * Extracts a full archive.
 *
 * @param {string} path - The path to the archive file.
 * @param {string} dest - The destination directory where the files will be extracted to.
 * @param {string} sevenBinPath - The path to the 7-Zip binary file.
 * @param {any} [cherryPick] - Optional array of files to extract from the archive.

 * @returns {Promise<boolean>} - A promise that resolves to true if the extraction was successful and false otherwise.
 */
function extractFullArchive(path: string, dest: string, sevenBinPath: string, cherryPick?: any): Promise<boolean> {
  let hasFiles = false;
  return new Promise((resolve, reject) => {
    extractFull(path, dest, { $bin: sevenBinPath, $cherryPick: cherryPick ?? [] })
      .on('data', () => (hasFiles = true))
      .on('end', () => resolve(hasFiles))
      .on('error', err => reject(err));
  });
}

/**
 * Extracts files from an archive.
 *
 * @param {string} path - The path to the archive file.
 * @param {string} dest - The destination directory for the extracted files.
 * @param {string} sevenBinPath - The path to the 7z binary.
 * @param {any} cherryPick - An optional array of files to extract from the archive.
 * @param {boolean} isRecursive - Whether to extract files recursively from subdirectories.
 * @return {Promise<boolean>} - A Promise that resolves to a boolean indicating whether any files were extracted.
 */
function extractFilesArchive(path: string, dest: string, sevenBinPath: string, cherryPick?: any, isRecursive = false): Promise<boolean> {
  let hasFiles = false;
  return new Promise((resolve, reject) => {
    extract(path, dest, { $bin: sevenBinPath, $cherryPick: cherryPick ?? [], recursive: isRecursive })
      .on('data', data => (hasFiles = true))
      .on('end', () => resolve(hasFiles))
      .on('error', err => reject(err));
  });
}

/**
 * Checks if the given archivePath refers to a single DLL file
 *
 * @param {string} archivePath - The path of the archive file.
 * @param {FileUnzipEvent} args - The file unzip event object.
 * @return {boolean} - True if the archivePath refers to a single DLL file, false otherwise.
 */
function checkForSingleDll(archivePath: string, args: FileUnzipEvent) {
  const isSingleDll = archivePath.endsWith('.dll');
  if (!isSingleDll) {
    return false;
  }

  const fileName = path.basename(archivePath);
  const newFileName = fileName.replace(/\(\d+\)/g, '');

  fs.copyFileSync(archivePath, path.join(args.akiInstancePath, clientModPath, newFileName));

  return true;
}

/**
 * Checks if an archive contains a single DLL file at root level
 *
 * @param {string} archivePath - The path to the archive.
 * @param {string} sevenBinPath - The path to the 7-Zip executable.
 * @return {Promise<boolean>} - A promise that resolves to true if the archive contains a single root-level DLL file, otherwise false.
 */
function checkForArchiveWithSingleDll(archivePath: string, sevenBinPath: string): Promise<boolean> {
  let dllFound = false;

  return new Promise(resolve => {
    list(archivePath, { $bin: sevenBinPath, $cherryPick: ['*.dll'] })
      .on('data', data => {
        if (!data.file.includes('/')) {
          dllFound = true;
        }
      })
      .on('end', () => resolve(dllFound));
  });
}

/**
 * Checks if an archive contains a single DLL file in a nested structure
 *
 * @param {string} archivePath - The path to the archive file.
 * @param {string} sevenBinPath - The path to the 7zip binary.
 * @returns {Promise<boolean>} - A promise that resolves to true if the archive contains a single DLL file, otherwise false.
 */
function checkForArchiveWithSingleDllInsideDirectory(archivePath: string, sevenBinPath: string): Promise<boolean> {
  let dllFound = false;
  let fileCount = 0;

  return new Promise(resolve => {
    list(archivePath, { $bin: sevenBinPath })
      .on('data', data => {
        if (data?.attributes?.[0] !== 'D') {
          if (path.extname(data.file) === '.dll') {
            dllFound = true;
            fileCount += 1;
          } else {
            fileCount += 1;
          }
        }
      })
      .on('end', () => resolve(fileCount === 1 && dllFound));
  });
}

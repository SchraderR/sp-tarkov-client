import * as path from 'path';
import { extract, extractFull, list } from 'node-7z';
import { clientPluginModPath, serverModPath } from '../constants';
import { copyFileSync, ensureDirSync } from 'fs-extra';
import { FileUnzipEvent } from '../../shared/models/unzip.model';
import { log } from 'electron-log';

export class ZipArchiveHelper {
  /**
   * Checks if a directory at the given path contains a server modification directory
   * with a leading directory by verifying the presence of 'package.json' files.
   *
   * @param {string} path - The directory path to check for server modifications.
   * @param {string} sevenBinPath - The path to the 7Zip binary.
   * @return {Promise<boolean>} - A promise that resolves to true if a server modification with
   * a leading directory is found, otherwise false.
   */
  checkForLeadingDirectoryServerMod(path: string, sevenBinPath: string): Promise<boolean> {
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
   * @param {string} archivePath - The path to the directory to search for the nested server module.
   * @param {string} sevenBinPath - The path to the 7zip executable.
   * @returns {Promise<boolean>} - A promise that resolves with a boolean indicating if the nested server module exists.
   */
  determineNestedServerModHappyPath(archivePath: string, sevenBinPath: string): Promise<string | null> {
    let nestedServerModName: string | null = null;

    return new Promise((resolve, reject) => {
      list(archivePath, { $bin: sevenBinPath, $cherryPick: [`*\\${serverModPath}`] })
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
   * @param {string} archivePath - The path to the directory to check.
   * @param {string} sevenBinPath - The path to the 7zip binary.
   * @returns {Promise<boolean>} - A promise that resolves with a boolean indicating if the directory is a server module.
   * @throws {Error} - If there is an error while determining the server module.
   */
  determineServerMod(archivePath: string, sevenBinPath: string): Promise<boolean> {
    let isServerMod = false;

    return new Promise((resolve, reject) => {
      list(archivePath, { $bin: sevenBinPath, $cherryPick: ['**\\package.json'], recursive: true })
        .on('data', () => (isServerMod = true))
        .on('end', () => resolve(isServerMod))
        .on('error', reject);
    });
  }

  /**
   * Determines if a client module exists in the given path.
   *
   * @param {string} archivePath - The path to search for client modules.
   * @param {string} sevenBinPath - The path to the 7zip executable.
   * @returns {Promise<boolean>} A promise that resolves to true if a client module exists, false otherwise.
   */
  determineClientMod(archivePath: string, sevenBinPath: string): Promise<boolean> {
    let isClientMod = false;

    return new Promise((resolve, reject) => {
      list(archivePath, { $bin: sevenBinPath, $cherryPick: ['**\\*.dll'], recursive: true })
        .on('data', () => (isClientMod = true))
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
  isHappyPathArchive(archivePath: string, sevenBinPath: string): Promise<boolean> {
    let hasFiles = false;

    return new Promise((resolve, reject) => {
      list(archivePath, { $bin: sevenBinPath, $cherryPick: [`${clientPluginModPath}/*`, `${clientPluginModPath}/*`, `${serverModPath}/*`] })
        .on('data', () => (hasFiles = true))
        .on('end', () => resolve(hasFiles))
        .on('error', error => reject(error));
    });
  }

  /**
   * Checks if the provided archivePath points to a single DLL file and, if so,
   * processes it by copying it to the destination and updates the new arguments.
   *
   * @param {string} archivePath - The path to the archive file.
   * @param {string} destination - The destination directory where the file should be copied.
   * @param {FileUnzipEvent} newArgs - An object containing the event details for file unzip.
   * @returns {{ newArgs: FileUnzipEvent, singleDll: boolean }} - An object containing the updated newArgs and a boolean indicating if the archive is a single DLL.
   */
  checkForSingleDll(
    archivePath: string,
    destination: string,
    newArgs: FileUnzipEvent
  ): {
    newArgs: FileUnzipEvent;
    singleDll: boolean;
  } {
    const isSingleDll = archivePath.endsWith('.dll');

    if (!isSingleDll) {
      return { singleDll: false, newArgs };
    }

    const fileName = path.basename(archivePath);
    const newFileName = fileName.replace(/\(\d+\)/g, '');
    ensureDirSync(path.join(destination, clientPluginModPath));
    copyFileSync(archivePath, path.join(destination, clientPluginModPath, newFileName));

    newArgs.name = newFileName;

    return { singleDll: true, newArgs };
  }

  /**
   * Checks if an archive contains a single DLL file at root level
   *
   * @param {string} archivePath - The path to the archive.
   * @param {string} sevenBinPath - The path to the 7-Zip executable.
   * @return {Promise<boolean>} - A promise that resolves to true if the archive contains a single root-level DLL file, otherwise false.
   */
  checkForArchiveWithSingleDll(archivePath: string, sevenBinPath: string): Promise<boolean> {
    let dllFound = false;

    return new Promise((resolve, reject) => {
      list(archivePath, { $bin: sevenBinPath, $cherryPick: ['*.dll'] })
        .on('data', data => {
          if (!data.file.includes('/')) {
            dllFound = true;
          }
        })
        .on('end', () => resolve(dllFound))
        .on('error', reject);
    });
  }

  /**
   * Checks if an archive contains a single DLL file in a nested structure
   *
   * @param {string} archivePath - The path to the archive file.
   * @param {string} sevenBinPath - The path to the 7zip binary.
   * @returns {Promise<boolean>} - A promise that resolves to true if the archive contains a single DLL file, otherwise false.
   */
  checkForArchiveWithSingleDllInsideDirectory(archivePath: string, sevenBinPath: string): Promise<boolean> {
    let dllFound = false;
    let fileCount = 0;

    return new Promise((resolve, reject) => {
      list(archivePath, { $bin: sevenBinPath })
        .on('data', data => {
          // console.log(data);
          if (data?.attributes?.[0] !== 'D') {
            if (path.extname(data.file) === '.dll' && !data.file.includes('/')) {
              dllFound = true;
              fileCount += 1;
            } else {
              fileCount += 1;
            }
          }
        })
        .on('end', () => resolve(fileCount === 1 && dllFound))
        .on('error', reject);
    });
  }

  /**
   * Extracts the full contents of an archive to a specified destination.
   *
   * @param {string} archivePath - The path to the archive file to be extracted.
   * @param {string} dest - The destination directory where files will be extracted.
   * @param {string} sevenBinPath - The path to the 7-zip binary for extraction.
   * @param {any} [cherryPick] - Optional list of specific files to extract from the archive.
   * @return {Promise<boolean>} - A promise that resolves to true if files were extracted, otherwise false.
   */
  extractFullArchive(archivePath: string, dest: string, sevenBinPath: string, cherryPick?: any): Promise<boolean> {
    let hasFiles = false;

    return new Promise((resolve, reject) => {
      extractFull(archivePath, dest, { $bin: sevenBinPath, $cherryPick: cherryPick ?? [], techInfo: true })
        .on('data', () => (hasFiles = true))
        .on('end', () => resolve(hasFiles))
        .on('error', err => reject(err));
    });
  }

  /**
   * Extracts files from an archive to a specified destination.
   *
   * @param {string} archivePath - The path to the archive file to be extracted.
   * @param {string} dest - The destination directory where files should be extracted.
   * @param {string} sevenBinPath - The path to the 7-Zip binary executable.
   * @param {any} [cherryPick] - Optional parameter to specify files to cherry-pick during extraction.
   * @param {boolean} [isRecursive=false] - Specifies whether the extraction should be recursive.
   * @return {Promise<boolean>} - A promise that resolves to true if files were extracted, otherwise false.
   */
  extractFilesArchive(archivePath: string, dest: string, sevenBinPath: string, cherryPick?: any, isRecursive: boolean = false): Promise<boolean> {
    let hasFiles = false;

    return new Promise((resolve, reject) => {
      extract(archivePath, dest, { $bin: sevenBinPath, $cherryPick: cherryPick ?? [], recursive: isRecursive })
        .on('data', () => (hasFiles = true))
        .on('end', () => resolve(hasFiles))
        .on('error', err => reject(err));
    });
  }
}

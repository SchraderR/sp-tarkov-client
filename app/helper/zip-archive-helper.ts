import * as path from 'path';
import * as fs from 'fs';
import { extract, extractFull, list } from 'node-7z';
import { clientModPath, serverModPath } from '../constants';
import { FileUnzipEvent } from '../../shared/models/unzip.model';

export class ZipArchiveHelper {
  /**
   * Checks if there is a leading directory in the server mod path.
   *
   * @param {string} path - The path to check.
   * @param {string} sevenBinPath - The path to seven-bin node module.
   * @return {Promise<boolean>} - A promise that resolves with a boolean indicating whether the leading directory exists.
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
   * @param {string} path - The path to the directory to search for the nested server module.
   * @param {string} sevenBinPath - The path to the 7zip executable.
   * @returns {Promise<boolean>} - A promise that resolves with a boolean indicating if the nested server module exists.
   */
  determineNestedServerModHappyPath(path: string, sevenBinPath: string): Promise<string | null> {
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
  determineServerMod(path: string, sevenBinPath: string): Promise<boolean> {
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
  determineClientMod(path: string, sevenBinPath: string): Promise<boolean> {
    let isClientMod = false;
    return new Promise((resolve, reject) => {
      list(path, { $bin: sevenBinPath, $cherryPick: ['**\\*.dll'], recursive: true })
        .on('data', data => (isClientMod = true))
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
  extractFullArchive(path: string, dest: string, sevenBinPath: string, cherryPick?: any): Promise<boolean> {
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
  extractFilesArchive(path: string, dest: string, sevenBinPath: string, cherryPick?: any, isRecursive: boolean = false): Promise<boolean> {
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
  checkForSingleDll(archivePath: string, args: FileUnzipEvent): boolean {
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
          if (data?.attributes?.[0] !== 'D') {
            if (path.extname(data.file) === '.dll') {
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
}

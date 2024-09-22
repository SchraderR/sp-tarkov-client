import * as path from 'path';
import * as fs from 'fs';
import { extract, extractFull, list } from 'node-7z';
import { clientPluginModPath, serverModPath } from '../constants';
import { FileUnzipEvent } from '../../shared/models/unzip.model';
import { FileTrackerHelper } from './file-tracker-helper';
import { UserSettingStoreModel } from '../../shared/models/user-setting.model';
import * as Store from 'electron-store';

export class ZipArchiveHelper {
  private readonly _store: Store<UserSettingStoreModel>;
  private readonly _instancePath: string;

  constructor(store: Store<UserSettingStoreModel>, instancePath: string) {
    this._store = store;
    this._instancePath = instancePath;
  }

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
   * Extracts the entire archive from the specified path to the destination directory.
   *
   * @param {string} archivePath - The path to the archive file.
   * @param {string} dest - The directory where the archive will be extracted.
   * @param {string} sevenBinPath - The path to the 7-Zip binary used for extraction.
   * @param {string} hubId - The identifier of the hub to track extracted files.
   * @param {any} [cherryPick] - Specific files to extract (optional).
   * @return {Promise<boolean>} A promise that resolves to a boolean indicating if files were extracted.
   */
  extractFullArchive(archivePath: string, dest: string, sevenBinPath: string, hubId: string, cherryPick?: any): Promise<boolean> {
    let hasFiles = false;
    let files: string[] = [];

    return new Promise((resolve, reject) => {
      extractFull(archivePath, dest, { $bin: sevenBinPath, $cherryPick: cherryPick ?? [] })
        .on('data', data => {
          files.push(path.resolve(dest, data.file));
          hasFiles = true;
        })
        .on('end', () => {
          if (hasFiles) {
            this.trackFiles(files, hubId);
          }

          resolve(hasFiles);
        })
        .on('error', err => reject(err));
    });
  }

  /**
   * Extracts files from a given archive path to a specified destination.
   *
   * @param {string} archivePath - The path to the archive file that needs to be extracted.
   * @param {string} dest - The destination directory where the extracted files should be placed.
   * @param {string} sevenBinPath - The path to the 7-zip binary.
   * @param {string} hubId - The hub identifier for tracking extracted files.
   * @param {any} [cherryPick] - An optional parameter for cherry-picking specific files from the archive.
   * @param {boolean} [isRecursive=false] - Optional flag indicating whether extraction should be recursive.
   * @return {Promise<boolean>} - A promise that resolves to true if files were extracted, otherwise false.
   */
  extractFilesArchive(
    archivePath: string,
    dest: string,
    sevenBinPath: string,
    hubId: string,
    cherryPick?: any,
    isRecursive: boolean = false
  ): Promise<boolean> {
    let hasFiles = false;
    let files: string[] = [];

    return new Promise((resolve, reject) => {
      extract(archivePath, dest, { $bin: sevenBinPath, $cherryPick: cherryPick ?? [], recursive: isRecursive })
        .on('data', data => {
          files.push(path.resolve(dest, data.file));
          hasFiles = true;
        })
        .on('end', () => {
          if (hasFiles) {
            this.trackFiles(files, hubId);
          }

          resolve(hasFiles);
        })
        .on('error', err => reject(err));
    });
  }

  /**
   * Checks whether the specified archive path points to a single DLL file and handles it accordingly.
   *
   * @param {string} archivePath - The path to the archive file.
   * @param {FileUnzipEvent} args - Contains details about the file unzip event including the destination path.
   * @param {string} hubId - The identifier for the hub where the files need to be tracked.
   * @return {boolean} - Returns true if the archivePath is a single DLL file and the operation was successful, otherwise false.
   */
  checkForSingleDll(archivePath: string, args: FileUnzipEvent, hubId: string): boolean {
    const isSingleDll = archivePath.endsWith('.dll');
    let files: string[] = [];

    if (!isSingleDll) {
      return false;
    }

    const fileName = path.basename(archivePath);
    const newFileName = fileName.replace(/\(\d+\)/g, '');
    console.log('data', fileName, newFileName);

    // TODO Check this
    files.push(fileName);
    files.push(newFileName);
    fs.copyFileSync(archivePath, path.join(args.sptInstancePath, clientPluginModPath, newFileName));
    this.trackFiles(files, hubId);

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

  private trackFiles(files: string[], hubId: string) {
    const fileTrackerHelper = new FileTrackerHelper();
    fileTrackerHelper.trackFilesWithHubId(files, hubId, this._instancePath, this._store);
  }
}

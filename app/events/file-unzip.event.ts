import { ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as sevenBin from '7zip-bin';
import * as unrar from 'node-unrar-js';
import { Extractor } from 'node-unrar-js';
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
      const isRarArchive = archivePath.endsWith('.rar');
      const isSingleDllFile = await checkForSingleDll(archivePath);
      if (isSingleDllFile) {
        const fileName = path.basename(archivePath);
        const newFileName = fileName.replace(/\(\d+\)/g, '');
        fs.copyFileSync(archivePath, path.join(args.akiInstancePath, clientModPath, newFileName));
        event.sender.send('file-unzip-completed');
        return;
      }

      if (!archivePath.endsWith('.zip') && !archivePath.endsWith('.7z') && !archivePath.endsWith('.rar')) {
        event.sender.send('file-unzip-error', 2);
        return;
      }

      if (isRarArchive) {
        await handleRarArchive(archivePath, args, event);
      } else {
        await handleOtherArchive(archivePath, sevenBinPath, args, event);
      }
    } catch (error) {
      console.error(error);
      event.sender.send('file-unzip-error', 3);
    }
  });
};

async function handleRarArchive(archivePath: string, args: FileUnzipEvent, event: Electron.IpcMainEvent) {
  const extractorForFiles = await unrar.createExtractorFromFile({ filepath: archivePath });

  const isRarWithSingleDll = await checkForRarWithSingleDll(extractorForFiles);
  if (isRarWithSingleDll) {
    const extractorForDll = await unrar.createExtractorFromFile({ filepath: archivePath, targetPath: path.join(args.akiInstancePath, clientModPath) });
    extractorForDll.extract();
    event.sender.send('file-unzip-completed');
    return;
  }
  const isRarHappyPath = await isHappyPathRar(extractorForFiles);
  if (!isRarHappyPath) {
    switch (args.kind) {
      case 'client':
        const extractorForClient = await unrar.createExtractorFromFile({ filepath: archivePath, targetPath: path.join(args.akiInstancePath, clientModPath) });
        const clientFiles = extractorForClient.extract().files;
        for (const file of clientFiles) {} // this extracts the files. wtf
        break;
      case 'server':
        const extractorForServer = await unrar.createExtractorFromFile({ filepath: archivePath, targetPath: path.join(args.akiInstancePath, serverModPath) });
        const serverFiles = extractorForServer.extract().files;
        for (const file of serverFiles) {} // this extracts the files. wtf
        break;
      default:
        break;
    }
    event.sender.send('file-unzip-completed');
    return;
  }

  event.sender.send('file-unzip-completed');
  return;
}

async function handleOtherArchive(archivePath: string, sevenBinPath: string, args: FileUnzipEvent, event: Electron.IpcMainEvent) {
  const isArchiveWithSingleDll = await checkForArchiveWithSingleDll(archivePath, sevenBinPath);

  if (isArchiveWithSingleDll) {
    await extractArchive(archivePath, path.join(args.akiInstancePath, clientModPath), sevenBinPath);
    event.sender.send('file-unzip-completed');
    return;
  }

  const isHappyPath = await isHappyPathArchive(archivePath, sevenBinPath);
  if (!isHappyPath) {
    switch (args.kind) {
      case 'client':
        await extractArchive(archivePath, path.join(args.akiInstancePath, clientModPath), sevenBinPath);
        break;
      case 'server':
        await extractArchive(archivePath, path.join(args.akiInstancePath, serverModPath), sevenBinPath);
        break;

      case undefined:
        const isClientMod = await checkForClientMod(archivePath, sevenBinPath);
        const isServerMod = await checkForServerMod(archivePath, sevenBinPath);

        if (isClientMod) {
          await extractArchive(archivePath, path.join(args.akiInstancePath, clientModPath), sevenBinPath);
        } else if (isServerMod) {
          await extractArchive(archivePath, path.join(args.akiInstancePath, serverModPath), sevenBinPath);
        }

        if (!isClientMod && !isServerMod) {
          event.sender.send('file-unzip-error', 3);
          throw new Error();
        }
        break;
    }
    event.sender.send('file-unzip-completed');
    return;
  }

  const clientModExtraction = extractArchive(archivePath, args.akiInstancePath, sevenBinPath, [`${clientModPath}/*`]);
  const serverModExtraction = extractArchive(archivePath, args.akiInstancePath, sevenBinPath, [`${serverModPath}/*`]);

  Promise.all([clientModExtraction, serverModExtraction])
    .then(([clientResult, serverResult]) => {
      if (clientResult || serverResult) {
        event.sender.send('file-unzip-completed');
      } else if (!clientResult && !serverResult) {
        event.sender.send('file-unzip-error', 3);
      }
    })
    .catch(err => console.error(err));
}

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

async function checkForSingleDll(path: string) {
  return path.endsWith('.dll');
}

function isHappyPathArchive(archivePath: string, sevenBinPath: string): Promise<boolean> {
  let isHappyPath = false;

  return new Promise((resolve, reject) => {
    list(archivePath, { $bin: sevenBinPath })
      .on('data', data => {
        const filePath = data.file;
        if (filePath.startsWith(clientModPath) || filePath.startsWith(serverModPath)) {
          isHappyPath = true;
        }
      })
      .on('end', () => resolve(isHappyPath))
      .on('error', error => reject(error));
  });
}

function extractArchive(path: string, dest: string, sevenBinPath: string, cherryPick?: any): Promise<boolean> {
  let hasFiles = false;
  return new Promise((resolve, reject) => {
    extractFull(path, dest, { $bin: sevenBinPath, $cherryPick: cherryPick ?? [] })
      .on('data', () => (hasFiles = true))
      .on('end', () => resolve(hasFiles))
      .on('error', err => reject(err));
  });
}

function checkForClientMod(path: string, sevenBinPath: string): Promise<boolean> {
  let isClientMod = false;
  return new Promise((resolve, reject) => {
    list(path, { $bin: sevenBinPath, $cherryPick: ['*.dll'], recursive: true })
      .on('data', data => (isClientMod = isRootDirectory(data.file)))
      .on('end', () => resolve(isClientMod))
      .on('error', reject);
  });
}

function checkForServerMod(path: string, sevenBinPath: string): Promise<boolean> {
  let isServerMod = false;
  return new Promise((resolve, reject) => {
    list(path, { $bin: sevenBinPath, $cherryPick: ['package.json'], recursive: true })
      .on('data', data => (isServerMod = isRootDirectory(data.file)))
      .on('end', () => resolve(isServerMod))
      .on('error', reject);
  });
}

function isRootDirectory(filePath: string): boolean {
  const parts = filePath.split('/');
  return parts.length <= 2;
}

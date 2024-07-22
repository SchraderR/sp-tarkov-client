import { ipcMain } from 'electron';
import * as path from 'path';
import { clientPatcherModPath, clientPluginModPath } from '../constants';
import * as fs from 'fs';
import * as log from 'electron-log';

export const handleClientModsEvent = () => {
  ipcMain.on('client-mod', async (event, akiInstancePath: string) => {
    try {
      if (fs.existsSync(akiInstancePath)) {
        const data = [];
        const rootClientPluginPath = path.join(akiInstancePath, clientPluginModPath);
        const rootClientPatchersPath = path.join(akiInstancePath, clientPatcherModPath);

        const rootDllFiles = fs
          .readdirSync(rootClientPluginPath, { withFileTypes: true })
          .filter(file => file.isFile() && path.extname(file.name) === '.dll')
          .map((f: any) => f);

        const rootDirectories = fs
          .readdirSync(rootClientPluginPath, { withFileTypes: true })
          .filter(dirent => dirent.isDirectory() && dirent.name !== 'spt')
          .map(dirent => dirent.name);

        for (const file of rootDllFiles) {
          const version = await getVersion(path.join(rootClientPluginPath, file.name));
          const patcherFiles = getPatcherFiles(rootClientPatchersPath, file.name);

          patcherFiles.forEach((patcherFile) => {
            data.push({
              name: patcherFile.name.split('.dll')[0],
              version,
              modPath: rootClientPatchersPath
            });
          })

          data.push({
            name: file.name.split('.dll')[0],
            version,
            modPath: rootClientPluginPath,
          });
        }

        for (let dir of rootDirectories) {
          const directoryDll = fs
            .readdirSync(path.join(rootClientPluginPath, dir), { withFileTypes: true })
            .filter(file => file.isFile() && path.extname(file.name) === '.dll')
            .map((f: any) => f);

          if (directoryDll.length === 0) {
            continue;
          }

          const dllFilePath = path.join(rootClientPluginPath, dir, directoryDll[0].name);
          const version = await getVersion(dllFilePath);
          const patcherFiles = getPatcherFiles(rootClientPatchersPath, directoryDll[0].name);

          patcherFiles.forEach((patcherFile) => {
            data.push({
              name: patcherFile.name.split('.dll')[0],
              version,
              modPath: rootClientPatchersPath
            });
          })

          data.push({
            name: directoryDll[0].name.split('.dll')[0],
            version,
            modPath: path.join(rootClientPluginPath, dir),
          });
        }

        event.sender.send('client-mod-completed', data);
      }
    } catch (error) {
      event.sender.send('client-mod-error', error);
      log.error(error);
    }
  });
};

async function getVersion(dllFilePath: string) {
  const exec = require('util').promisify(require('child_process').exec);
  const { stderr, stdout } = await exec(`powershell "[System.Diagnostics.FileVersionInfo]::GetVersionInfo('${dllFilePath}').FileVersion`);

  if (stderr) {
    return stderr;
  }

  return stdout;
}

function getPatcherFiles(rootClientPatchersPath: string, dllFileName: string) {
  const baseName = dllFileName.split('.dll')[0];
  return fs
    .readdirSync(rootClientPatchersPath, { withFileTypes: true })
    .filter(
      file =>
        file.isFile() &&
        file.name.startsWith(baseName) &&
        file.name.toLowerCase().includes('.prepatch.') &&
        path.extname(file.name) === '.dll'
    )
}

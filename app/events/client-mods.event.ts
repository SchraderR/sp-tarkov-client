import { ipcMain } from 'electron';
import * as path from 'path';
import { clientModPath } from '../constants';
import * as fs from 'fs';
import * as log from 'electron-log';

export const handleClientModsEvent = () => {
  ipcMain.on('client-mod', async (event, akiInstancePath: string) => {
    try {
      if (fs.existsSync(akiInstancePath)) {
        const data = [];
        const rootServerPath = path.join(akiInstancePath, clientModPath);
        const rootDllFiles = fs
          .readdirSync(rootServerPath, { withFileTypes: true })
          .filter(file => file.isFile() && path.extname(file.name) === '.dll')
          .map((f: any) => f);

        for (const file of rootDllFiles) {
          const version = await getVersion(path.join(file.path, file.name));
          data.push({
            name: file.name.split('.dll')[0],
            version,
            modPath: rootServerPath,
            modOriginalPath: path.join(file.path, file.name),
            modOriginalName: file.name,
            isEnabled: true,
          });
        }

        const rootDirectories = fs
          .readdirSync(rootServerPath, { withFileTypes: true })
          .filter(dirent => dirent.isDirectory() && dirent.name !== 'spt')
          .map(dirent => dirent.name);

        for (let dir of rootDirectories) {
          const directoryDll = fs
            .readdirSync(path.join(rootServerPath, dir), { withFileTypes: true })
            .filter(file => file.isFile() && path.extname(file.name) === '.dll')
            .map((f: any) => f);

          if (directoryDll.length === 0) {
            continue;
          }

          const filePath = path.join(directoryDll[0].path, directoryDll[0].name);
          const version = await getVersion(filePath);
          data.push({
            isDirectory: true,
            name: dir,
            version,
            isEnabled: true,
            modOriginalPath: directoryDll[0].path,
            modOriginalName: dir,
            modPath: directoryDll[0].path,
            subMods: await Promise.all(
              directoryDll.map(async m => {
                const subModPath = path.join(directoryDll[0].path, m.name);
                return {
                  version: await getVersion(subModPath),
                  modPath: directoryDll[0].path,
                  name: m.name.split('.dll')[0],
                };
              })
            ),
          });
        }

        event.sender.send('client-mod-completed', data);
      }
    } catch (error: any) {
      event.sender.send('client-mod-error', { error, isPowerShellIssue: error.isPowerShellIssue });
      log.error(error);
    }
  });
};

async function getVersion(dllFilePath: string) {
  try {
    const exec = require('util').promisify(require('child_process').exec);
    const { stderr, stdout } = await exec(`powershell "[System.Diagnostics.FileVersionInfo]::GetVersionInfo('${dllFilePath}').FileVersion`);

    if (stderr) {
      return stderr;
    }

    return stdout;
  } catch (error) {
    throw { error, isPowerShellIssue: true };
  }
}

import { app, ipcMain } from 'electron';
import * as path from 'path';
import { clientPatcherModPath, clientPluginModPath } from '../constants';
import * as fs from 'fs';
import * as log from 'electron-log';

export const handleClientModsEvent = () => {
  ipcMain.on('client-mod', async (event, sptInstancePath: string) => {
    try {
      if (fs.existsSync(sptInstancePath)) {
        let data = [];
        const rootClientPluginPath = path.join(sptInstancePath, clientPluginModPath);
        const rootClientPatchersPath = path.join(sptInstancePath, clientPatcherModPath);

        const patcherDllFiles = fs
          .readdirSync(rootClientPatchersPath, { withFileTypes: true })
          .filter(
            file =>
              file.isFile() &&
              (file.name.toLowerCase().includes('.prepatch.') || file.name.toLowerCase().includes('_prepatch.')) &&
              path.extname(file.name) === '.dll'
          )
          .map((f: any) => f);

        for (const file of patcherDllFiles) {
          const version = await getVersion(path.join(rootClientPatchersPath, file.name));

          data.push({
            name: file.name.split('.dll')[0],
            version,
            isPrePatcherMod: true,
            modPath: rootClientPatchersPath,
            modOriginalPath: path.join(file.path, file.name),
            modOriginalName: file.name,
            isEnabled: true,
          });
        }

        const rootDllFiles = fs
          .readdirSync(rootClientPluginPath, { withFileTypes: true })
          .filter(file => file.isFile() && path.extname(file.name) === '.dll')
          .map((f: any) => f);

        for (const file of rootDllFiles) {
          const version = await getVersion(path.join(rootClientPluginPath, file.name));

          data.push({
            name: file.name.split('.dll')[0],
            version,
            isPrePatcherMod: false,
            modPath: rootClientPluginPath,
            modOriginalPath: path.join(file.path, file.name),
            modOriginalName: file.name,
            isEnabled: true,
          });
        }

        const rootDirectories = fs
          .readdirSync(rootClientPluginPath, { withFileTypes: true })
          .filter(dirent => dirent.isDirectory() && dirent.name !== 'spt')
          .map(dirent => dirent.name);

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

          data.push({
            isDirectory: true,
            name: dir,
            version,
            isEnabled: true,
            isPrePatcherMod: false,
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

        data = await checkForDisabledClientMods(data, sptInstancePath);

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

function checkForDisabledClientMods(data: any[], sptInstancePath: string): Promise<any[]> {
  return new Promise<any[]>(async (resolve, reject) => {
    try {
      const appPath = app.getPath('userData');
      const instanceName = sptInstancePath.split('\\').pop();
      if (!instanceName) {
        return data;
      }

      resolve(data);
    } catch (e) {
      console.log(e);
    }
  });
}

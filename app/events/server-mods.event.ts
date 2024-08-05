import { app, ipcMain } from 'electron';
import * as path from 'path';
import { serverModPath } from '../constants';
import * as log from 'electron-log';
import { ensureDirSync, existsSync } from 'fs-extra';
import { readdirSync, readFileSync } from 'node:fs';

export const handleServerModsEvent = () => {
  ipcMain.on('server-mod', async (event, instancePath: string) => {
    try {
      if (existsSync(instancePath)) {
        const rootServerPath = path.join(instancePath, serverModPath);
        const dirs = readdirSync(rootServerPath, { withFileTypes: true })
          .filter(dirent => dirent.isDirectory() && dirent.name !== 'spt')
          .map(dirent => dirent.name);

        let data = [];
        for (let dir of dirs) {
          const filePath = path.join(rootServerPath, dir, 'package.json');
          if (existsSync(filePath)) {
            const packageJson = JSON.parse(readFileSync(filePath, 'utf8'));
            const { name, version, akiVersion, sptVersion } = packageJson;
            if (name && version && (akiVersion || sptVersion)) {
              data.push({
                name,
                version,
                sptVersion: sptVersion ?? akiVersion,
                modPath: path.join(rootServerPath, dir),
                modOriginalPath: path.join(rootServerPath, dir),
                modOriginalName: dir,
                isEnabled: true,
              });
            }
          }
        }

        data = await checkForDisabledServerMods(data, instancePath);

        event.sender.send('server-mod-completed', data);
      }
    } catch (error) {
      log.error(error);
      event.sender.send('server-mod-error', error);
    }
  });

  function checkForDisabledServerMods(data: any[], instancePath: string): Promise<any[]> {
    return new Promise<any[]>(async (resolve, reject) => {
      try {
        const appPath = app.getPath('userData');
        const instanceName = instancePath.split('\\').pop();
        if (!instanceName) {
          return data;
        }

        const instanceServerDisabledModPath = path.join(appPath, 'instances', instanceName, 'disabled', 'server');
        ensureDirSync(instanceServerDisabledModPath);

        const disabledServerMods = readdirSync(instanceServerDisabledModPath, { withFileTypes: true });
        for (const mod of disabledServerMods) {
          const filePath = path.join(instanceServerDisabledModPath, mod.name, 'package.json');
          if (existsSync(filePath)) {
            const packageJson = JSON.parse(readFileSync(filePath, 'utf8'));
            const { name, version, akiVersion, sptVersion } = packageJson;

            if (name && version && (akiVersion || sptVersion)) {
              data.push({
                name,
                version,
                sptVersion: sptVersion ?? akiVersion,
                modPath: path.join(instanceServerDisabledModPath, mod.name),
                modOriginalPath: path.join(instanceServerDisabledModPath, mod.name),
                modOriginalName: mod.name,
                isEnabled: false,
              });
            }
          }
        }
        resolve(data);
      } catch (e) {
        console.log(e);
      }
    });
  }
};

import { ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { serverModPath } from '../constants';
import * as log from 'electron-log';

export const handleServerModsEvent = () => {
  ipcMain.on('server-mod', async (event, instancePath: string) => {
    try {
      if (fs.existsSync(instancePath)) {
        const rootServerPath = path.join(instancePath, serverModPath);
        const dirs = fs
          .readdirSync(rootServerPath, { withFileTypes: true })
          .filter(dirent => dirent.isDirectory() && dirent.name !== 'spt')
          .map(dirent => dirent.name);

        const data = [];
        for (let dir of dirs) {
          const filePath = path.join(rootServerPath, dir, 'package.json');
          if (fs.existsSync(filePath)) {
            const packageJson = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            const { name, version, akiVersion, sptVersion } = packageJson;
            if (name && version && (akiVersion || sptVersion)) {
              data.push({ name, version, sptVersion: sptVersion ?? akiVersion, modPath: path.join(rootServerPath, dir) });
            }
          }
        }

        event.sender.send('server-mod-completed', data);
      }
    } catch (error) {
      log.error(error);
      event.sender.send('server-mod-error', error);
    }
  });
};

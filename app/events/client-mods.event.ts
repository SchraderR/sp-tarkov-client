import { ipcMain } from 'electron';
import * as path from 'path';
import { clientModPath } from '../shared/constants';
import * as fs from 'fs';

export const handleClientModsEvent = () => {
  ipcMain.on('client-mod', async (event, akiInstancePath: string) => {
    try {
      if (fs.existsSync(akiInstancePath)) {
        const data = [];
        const rootServerPath = path.join(akiInstancePath, clientModPath);
        const dllFiles = fs
          .readdirSync(rootServerPath, { withFileTypes: true })
          .filter(file => file.isFile() && path.extname(file.name) === '.dll')
          .map((f: any) => f);

        for (const file of dllFiles) {
          const version = await getVersion(path.join(file.path, file.name));
          data.push({ name: file.name, version });
        }

        event.sender.send('client-mod-completed', data);
      }
    } catch (error) {
      console.error(error);
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

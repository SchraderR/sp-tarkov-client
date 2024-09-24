import { dialog, ipcMain } from 'electron';
import { BrowserWindowSingleton } from '../browserWindow';
import { readFileSync, writeFileSync } from 'fs-extra';
import axios from 'axios';
import { Mod } from '../../src/app/core/models/mod';

export const handleSharingModsEvents = () => {
  ipcMain.on('export-mods-file-system', (event, mods: string[]) => {
    const browserWindow = BrowserWindowSingleton.getInstance();

    const filePath = dialog.showSaveDialogSync(browserWindow, { defaultPath: 'exportMods.json' });
    if (!filePath) {
      return;
    }

    writeFileSync(filePath, JSON.stringify(mods), { encoding: 'utf-8' });
    event.sender.send('export-mods-file-system-completed');
  });

  ipcMain.on('import-mods-file-system', async event => {
    const filePath = dialog.showOpenDialogSync({ filters: [{ name: 'JSON', extensions: ['json'] }], properties: ['openFile'] });
    if (!filePath) {
      return;
    }

    const importedText = readFileSync(filePath[0], { encoding: 'utf-8' });
    let importedModHubIds = JSON.parse(importedText);
    let importedModResult: Mod[] = [];

    for (let hubId of importedModHubIds) {
      const response = await axios({
        url: `https://hub.sp-tarkov.com/files/file/${hubId}`,
        method: 'get',
        timeout: 20000,
        maxRedirects: 0,
        validateStatus: (status: number) => status >= 200 && status < 400,
      });

      importedModResult.push({ hubId, fileUrl: response.headers['location'] } as Mod);
    }

    event.sender.send('import-mods-file-system-completed', importedModResult);
  });
};

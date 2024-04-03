import { ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { modLoadOrderConfigPath } from '../constants';

export const handleModLoadOrderEvents = () => {
  ipcMain.on('mod-load-order', (event, akiInstancePath: string) => {
    try {
      const akiCoreJson = fs.readFileSync(path.join(akiInstancePath, modLoadOrderConfigPath), 'utf-8');
      event.sender.send('mod-load-order-completed', akiCoreJson);
    } catch (e) {
      console.log(e);
      event.sender.send('mod-load-order-completed', JSON.stringify({ order: [] }));
    }
  });
};

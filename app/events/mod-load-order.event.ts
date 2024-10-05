import { ipcMain } from 'electron';
import * as path from 'path';
import { modLoadOrderConfigPath, serverModPath } from '../constants';
import * as log from 'electron-log';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'fs-extra';
import { statSync } from 'node:fs';

export const handleModLoadOrderEvents = () => {
  ipcMain.on('mod-load-order', (event, instancePath: string) => {
    try {
      const configFilePath = path.join(instancePath, modLoadOrderConfigPath);
      const modDirectoryPath = path.join(instancePath, serverModPath);

      let currentModOrder: string[] = [];

      if (existsSync(configFilePath)) {
        const rawOrderData = readFileSync(configFilePath, 'utf-8');
        currentModOrder = JSON.parse(rawOrderData).order || [];

        const currentDirectories = readdirSync(modDirectoryPath, { withFileTypes: true, recursive: true })
          .filter(dirent => statSync(path.join((dirent as any).path, dirent.name)).isDirectory() || dirent.isDirectory())
          .map(dirent => dirent.name);

        currentModOrder = currentModOrder.filter(mod => currentDirectories.includes(mod));

        const newMods = currentDirectories.filter(mod => !currentModOrder.includes(mod));
        currentModOrder = currentModOrder.concat(newMods);

        const updatedOrderData = JSON.stringify({ order: currentModOrder }, null, 2);
        writeFileSync(configFilePath, updatedOrderData, 'utf-8');

        log.info(`Updated ${modLoadOrderConfigPath} with current mod directories.`);
      } else {
        currentModOrder = readdirSync(modDirectoryPath, { withFileTypes: true })
          .filter(dirent => statSync(path.join((dirent as any).path, dirent.name)).isDirectory() || dirent.isDirectory())
          .map(dirent => dirent.name);

        if (!currentModOrder.length) {
          event.sender.send('mod-load-order-completed', JSON.stringify({ order: [] }));
          return;
        }

        const orderData = JSON.stringify({ order: currentModOrder }, null, 2);
        writeFileSync(configFilePath, orderData, 'utf-8');

        log.info(`Created ${modLoadOrderConfigPath} with mod directories -> ${orderData}`);
      }

      const coreJson = readFileSync(configFilePath, 'utf-8');
      event.sender.send('mod-load-order-completed', coreJson);
    } catch (e) {
      log.error(e);
      event.sender.send('mod-load-order-completed', JSON.stringify({ order: [] }));
    }
  });

  ipcMain.on('save-mod-load-order', (event, args: { instancePath: string; modLoadOrder: string[] }) => {
    try {
      const configFilePath = path.join(args.instancePath, modLoadOrderConfigPath);

      const orderData = JSON.stringify({ order: args.modLoadOrder }, null, 2);
      writeFileSync(configFilePath, orderData, 'utf-8');

      log.info(`Saved new mod order to ${modLoadOrderConfigPath} -> ${orderData}`);

      event.sender.send('save-mod-load-order-completed');
    } catch (e) {
      log.error(e);
      event.sender.send('save-mod-load-order-error');
    }
  });
};

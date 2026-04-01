import * as fs from 'fs';
import * as path from 'path';
import * as log from 'electron-log';
import { ipcMain } from 'electron';
import { InstanceDto } from '../../shared/models/user-setting.model';
import { stableSptCoreConfigPath } from '../constants';
import { findInstanceById, getAllInstances, removeInstance , setInstanceActive } from '../database/controller/instance.controller';

export const handleUserSettingStoreEvents = () => {
  ipcMain.on('user-instances', async event => await getAllInstancesEvent(event));
  ipcMain.on('user-instance-active', (event, instanceId: number) => toggleInstanceActiveEvent(event, instanceId));
  ipcMain.on('user-instance-remove', (event, instanceId: number) => removeUserSettingStoreEvent(event, instanceId));
};

async function toggleInstanceActiveEvent(event: Electron.IpcMainEvent, instanceId: number) {
  await setInstanceActive(instanceId);
  event.sender.send('user-instance-active-completed');
}

async function getAllInstancesEvent(event: Electron.IpcMainEvent) {
  const sptInstances = await getAllInstances();
  if (!sptInstances || sptInstances.length === 0) {
    log.warn('No instances found.');
    event.sender.send('user-instances-completed', []);
    return;
  }

  const userSettingModelResult: InstanceDto[] = [];
  for (const sptInstance of sptInstances) {
    try {
      let sptCoreJson: string = '';

      stableSptCoreConfigPath.forEach(sptCorePath => {
        if (!fs.existsSync(path.join(sptInstance.sptRootDirectory, sptCorePath))) {
          log.error(`${sptInstance.sptRootDirectory}/${sptCorePath} not available.`);
          return;
        }

        sptCoreJson = fs.readFileSync(path.join(sptInstance.sptRootDirectory, sptCorePath), 'utf-8');
      });

      userSettingModelResult.push({
        id: sptInstance.id,
        sptRootDirectory: sptInstance.sptRootDirectory,
        isActive: sptInstance.isActive,
        modCache: sptInstance.modCache,

        sptCore: sptCoreJson ? JSON.parse(sptCoreJson) : null,
        isValid: !!sptCoreJson,
        // isActive: sptInstance.isActive,
        // isLoading: sptInstance.isLoading,
        // isError: sptInstance.isError,
        // clientMods: sptInstance.clientMods ?? [],
        // serverMods: sptInstance.serverMods ?? [],
      });
    } catch (e) {
      log.error(e);
    }
  }

  event.sender.send('user-instances-completed', userSettingModelResult);
}

async function removeUserSettingStoreEvent(event: Electron.IpcMainEvent, instanceId: number) {
  const instance = await findInstanceById(instanceId);
  if (!instance) {
    log.error(`Instance with id ${instanceId} not found.`);
    return;
  }

  await removeInstance(instanceId);
  event.sender.send('user-instance-remove-completed');
}

import * as fs from 'fs';
import * as path from 'path';
import * as log from 'electron-log';
import { ipcMain } from 'electron';
import { InstanceDto } from '../../shared/models/user-setting.model';
import { sptServerMetadataPath } from '../constants';
import { findInstanceById, getAllInstances, removeInstance, setInstanceActive } from '../database/controller/instance.controller';
import { getVersion } from '../helper/powershell.helper';

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
      let sptVersion = '';
      if (!fs.existsSync(path.join(sptInstance.sptRootDirectory, sptServerMetadataPath))) {
        log.error(`${path.join(sptInstance.sptRootDirectory, sptServerMetadataPath)} not available.`);
      }

      try {
        sptVersion = await getVersion(path.join(sptInstance.sptRootDirectory, sptServerMetadataPath));
      } catch (error) {
        log.error(error);
      }

      userSettingModelResult.push({
        id: sptInstance.id,
        sptRootDirectory: sptInstance.sptRootDirectory,
        isActive: sptInstance.isActive,
        modCache: sptInstance.modCache,
        sptVersion: sptVersion,
        isValid: !!sptVersion,
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

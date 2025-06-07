import { ipcMain } from 'electron';
import * as fs from 'fs';
import * as Store from 'electron-store';
import * as path from 'path';
import { SptInstance, UserSettingModel, UserSettingStoreModel } from '../../shared/models/user-setting.model';
import { stableSptCoreConfigPath } from '../constants';
import { error, warn } from 'electron-log';

export const handleUserSettingStoreEvents = (store: Store<UserSettingStoreModel>) => {
  ipcMain.on('user-setting', (event, instancePath: string) => {
    const instances = store.get('sptInstances');
    const activeInstance = instances.find(i => i.sptRootDirectory === instancePath);

    event.sender.send('user-setting-completed', activeInstance);
  });

  ipcMain.on('user-settings', async event => {
    await handleUserSettingStoreEvent(event, store);
  });

  ipcMain.on('user-settings-update', (event, instance: SptInstance) => {
    handleUpdateUserSettingStoreEvent(event, store, instance);
  });

  ipcMain.on('user-settings-remove', (event, rootDirectory: string) => {
    handleRemoveUserSettingStoreEvent(event, store, rootDirectory);
  });
};

function handleRemoveUserSettingStoreEvent(event: Electron.IpcMainEvent, store: Store<UserSettingStoreModel>, sptRootDirectory: string) {
  const index = store.get('sptInstances').findIndex(i => i.sptRootDirectory === sptRootDirectory);
  if (index === -1) {
    // TODO Exception
    return;
  }

  const currentSetting = store.get('sptInstances').filter(i => i.sptRootDirectory !== sptRootDirectory);
  store.set('sptInstances', currentSetting);
  event.sender.send('user-settings-remove-completed');
}

function handleUpdateUserSettingStoreEvent(event: Electron.IpcMainEvent, store: Store<UserSettingStoreModel>, sptInstance: SptInstance) {
  const currentIndex = store.get('sptInstances').findIndex(i => i.sptRootDirectory === sptInstance.sptRootDirectory);
  if (currentIndex === -1) {
    // TODO Exception
    return;
  }

  const instances = store.get('sptInstances');
  instances.forEach(i => (i.isActive = i.sptRootDirectory === sptInstance.sptRootDirectory));
  store.set('sptInstances', instances);

  event.sender.send('user-settings-update-completed');
}

async function handleUserSettingStoreEvent(event: Electron.IpcMainEvent, store: Store<UserSettingStoreModel>) {
  const sptInstances = store.get('sptInstances');
  if (!sptInstances || sptInstances.length === 0) {
    // TODO ERROR HANDLING
    event.sender.send('user-settings-completed', []);
    return;
  }

  const userSettingModelResult: UserSettingModel[] = [];

  for (const sptInstance of sptInstances) {
    try {
      let sptCoreJson: string = '';

      stableSptCoreConfigPath.forEach(sptCorePath => {
        if (!fs.existsSync(path.join(sptInstance.sptRootDirectory, sptCorePath))) {
          warn(`${sptInstance.sptRootDirectory}/${sptCorePath} not available.`);
          return;
        }

        sptCoreJson = fs.readFileSync(path.join(sptInstance.sptRootDirectory, sptCorePath), 'utf-8');
      });

      userSettingModelResult.push({
        sptRootDirectory: sptInstance.sptRootDirectory,
        sptCore: sptCoreJson ? JSON.parse(sptCoreJson) : null,
        isValid: !!sptCoreJson,
        isActive: sptInstance.isActive,
        isLoading: sptInstance.isLoading,
        trackedMods: sptInstance.trackedMods,
        isError: sptInstance.isError,
        clientMods: sptInstance.clientMods ?? [],
        serverMods: sptInstance.serverMods ?? [],
      });
    } catch (e) {
      error(e);
    }
  }
  event.sender.send('user-settings-completed', userSettingModelResult);
}

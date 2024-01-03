import { ipcMain } from 'electron';
import * as fs from 'fs';
import * as Store from 'electron-store';
import * as path from 'path';
import { AkiInstance, UserSettingModel, UserSettingStoreModel } from '../../shared/models/user-setting.model';
import { stableAkiCoreConfigPath } from '../shared/constants';

export const handleUserSettingStoreEvents = (store: Store<UserSettingStoreModel>) => {
  ipcMain.on('user-settings', async event => {
    await handleUserSettingStoreEvent(event, store);
  });

  ipcMain.on('user-settings-update', (event, akiInstance: AkiInstance) => {
    handleUpdateUserSettingStoreEvent(event, store, akiInstance);
  });

  ipcMain.on('user-settings-remove', (event, akiRootDirectory: string) => {
    handleRemoveUserSettingStoreEvent(event, store, akiRootDirectory);
  });
};

function handleRemoveUserSettingStoreEvent(event: Electron.IpcMainEvent, store: Store<UserSettingStoreModel>, akiRootDirectory: string) {
  const index = store.get('akiInstances').findIndex(i => i.akiRootDirectory === akiRootDirectory);
  if (index === -1) {
    // TODO Exception
    return;
  }

  const currentSetting = store.get('akiInstances').filter(i => i.akiRootDirectory !== akiRootDirectory);
  store.set('akiInstances', currentSetting);
  event.sender.send('user-settings-remove-completed');
}

function handleUpdateUserSettingStoreEvent(event: Electron.IpcMainEvent, store: Store<UserSettingStoreModel>, akiInstance: AkiInstance) {
  const currentIndex = store.get('akiInstances').findIndex(i => i.akiRootDirectory === akiInstance.akiRootDirectory);
  if (currentIndex === -1) {
    // TODO Exception
    return;
  }

  const instances = store.get('akiInstances');
  instances.forEach(i => (i.isActive = i.akiRootDirectory === akiInstance.akiRootDirectory));
  store.set('akiInstances', instances);

  event.sender.send('user-settings-update-completed');
}

async function handleUserSettingStoreEvent(event: Electron.IpcMainEvent, store: Store<UserSettingStoreModel>) {
  const akiInstances = store.get('akiInstances');
  if (!akiInstances || akiInstances.length === 0) {
    // TODO ERROR HANDLING
    // SEND MESSAGE TO SET ROOT DIR
    return;
  }

  const userSettingModelResult: UserSettingModel[] = [];

  for (const akiInstance of akiInstances) {
    try {
      const akiCoreJson = fs.readFileSync(path.join(akiInstance.akiRootDirectory, stableAkiCoreConfigPath), 'utf-8');
      if (!akiCoreJson) {
        // TODO ERROR HANDLING
        console.error(akiCoreJson);
        return;
      }
      userSettingModelResult.push({
        akiRootDirectory: akiInstance.akiRootDirectory,
        akiCore: JSON.parse(akiCoreJson),
        isValid: akiInstance.isValid,
        isActive: akiInstance.isActive,
        clientMods: akiInstance.clientMods,
        serverMods: akiInstance.serverMods
      });
    } catch (e) {
      // add to object and return a missing path error message
    }
  }
  event.sender.send('user-settings-completed', userSettingModelResult);
}

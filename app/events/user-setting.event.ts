import { ipcMain } from 'electron';
import * as fs from 'fs';
import * as Store from 'electron-store';
import * as path from 'path';
import { AkiInstance, UserSettingModel, UserSettingStoreModel } from '../../shared/models/user-setting.model';
import { stableAkiCoreConfigPath } from '../shared/constants';

export const handleUserSettingStoreEvents = (store: Store<UserSettingStoreModel>) => {
  ipcMain.on('user-settings', event => {
    handleUserSettingStoreEvent(event, store);
  });

  ipcMain.on('user-settings-update', (event, akiInstance: AkiInstance) => {
    console.log ( akiInstance );
    handleUpdateUserSettingStoreEvent(event, store, akiInstance);
  });
};

function handleUpdateUserSettingStoreEvent(event: Electron.IpcMainEvent, store: Store<UserSettingStoreModel>, akiInstance: AkiInstance) {
  const index = store.get('akiInstances').findIndex(i => i.akiRootDirectory === akiInstance.akiRootDirectory);
  if (index === -1) {
    // TODO Exception
    return;
  }

  store.set(`akiInstances.${index}`, akiInstance);
  event.sender.send('user-settings-update-completed');
}

function handleUserSettingStoreEvent(event: Electron.IpcMainEvent, store: Store<UserSettingStoreModel>) {
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
      });
    } catch (e) {
      // add to object and return a missing path error message
    }
  }

  event.sender.send('user-settings-completed', userSettingModelResult);
  return;
}

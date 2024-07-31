import { ipcMain } from 'electron';
import * as fs from 'fs';
import * as Store from 'electron-store';
import * as path from 'path';
import { SptInstance, UserSettingModel, UserSettingStoreModel } from '../../shared/models/user-setting.model';
import { stableSptCoreConfigPath } from '../constants';
import * as log from 'electron-log';

export const handleUserSettingStoreEvents = (store: Store<UserSettingStoreModel>) => {
  ipcMain.on('user-settings', async event => {
    await handleUserSettingStoreEvent(event, store);
  });

  ipcMain.on('user-settings-update', (event, akiInstance: SptInstance) => {
    handleUpdateUserSettingStoreEvent(event, store, akiInstance);
  });

  ipcMain.on('user-settings-remove', (event, akiRootDirectory: string) => {
    handleRemoveUserSettingStoreEvent(event, store, akiRootDirectory);
  });
};

function handleRemoveUserSettingStoreEvent(event: Electron.IpcMainEvent, store: Store<UserSettingStoreModel>, akiRootDirectory: string) {
  const index = store.get('sptInstances').findIndex(i => i.sptRootDirectory === akiRootDirectory);
  if (index === -1) {
    // TODO Exception
    return;
  }

  const currentSetting = store.get('sptInstances').filter(i => i.sptRootDirectory !== akiRootDirectory);
  store.set('sptInstances', currentSetting);
  event.sender.send('user-settings-remove-completed');
}

function handleUpdateUserSettingStoreEvent(event: Electron.IpcMainEvent, store: Store<UserSettingStoreModel>, akiInstance: SptInstance) {
  const currentIndex = store.get('sptInstances').findIndex(i => i.sptRootDirectory === akiInstance.sptRootDirectory);
  if (currentIndex === -1) {
    // TODO Exception
    return;
  }

  const instances = store.get('sptInstances');
  instances.forEach(i => (i.isActive = i.sptRootDirectory === akiInstance.sptRootDirectory));
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
        if (!fs.existsSync(path.join(sptInstance.sptRootDirectory ?? sptInstance.akiRootDirectory, sptCorePath))) {
          log.error(`${sptInstance.sptRootDirectory ?? sptInstance.akiRootDirectory}/${sptCorePath} not available.`);
          return;
        }

        sptCoreJson = fs.readFileSync(path.join(sptInstance.sptRootDirectory ?? sptInstance.akiRootDirectory, sptCorePath), 'utf-8');
      });

      userSettingModelResult.push({
        sptRootDirectory: sptInstance.sptRootDirectory ?? sptInstance.akiRootDirectory,
        sptCore: sptCoreJson ? JSON.parse(sptCoreJson) : null,
        isValid: !!sptCoreJson,
        isActive: sptInstance.isActive,
        isLoading: sptInstance.isLoading,
        isError: sptInstance.isError,
        isPowerShellIssue: sptInstance.isPowerShellIssue,
        clientMods: sptInstance.clientMods ?? [],
        serverMods: sptInstance.serverMods ?? [],
      });
    } catch (e) {
      log.error(e);
    }
  }
  event.sender.send('user-settings-completed', userSettingModelResult);
}

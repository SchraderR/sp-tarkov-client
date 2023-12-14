import { ipcMain } from 'electron';
import * as fs from 'fs';
import * as Store from 'electron-store';
import * as path from 'path';
import { UserSettingModel, UserSettingStoreModel } from '../../shared/models/user-setting.model';
import { stableAkiCoreConfigPath } from '../shared/constants';

export const handleUserSettingEvent = (store: Store<UserSettingStoreModel>) => {
  ipcMain.on('user-settings', event => {
    const akiInstances = store.get('akiInstances');
    console.log(akiInstances);
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
          isValid: true,
          isActive: false
        });
      } catch (e) {
        // add to object and return a missing path error message
      }
    }

    event.sender.send('user-settings-complete', userSettingModelResult);
  });
};

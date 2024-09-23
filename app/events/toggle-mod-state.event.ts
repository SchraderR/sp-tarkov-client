import { app, ipcMain } from 'electron';
import * as path from 'path';
import { ToggleModStateModel } from '../../shared/models/toggle-mod-state.model';
import { existsSync, mkdirSync, readlinkSync, statSync, readdirSync } from 'fs-extra';
import * as Store from 'electron-store';
import { UserSettingStoreModel } from '../../shared/models/user-setting.model';
import { error, info } from 'electron-log';
import { clientPluginModPath, serverModPath } from '../constants';
import { TrackedMod } from './file-tracking.event';
import { symlinkSync, unlinkSync } from 'node:fs';

export const toggleModStateEvent = (store: Store<UserSettingStoreModel>) => {
  ipcMain.on('toggle-mod-state', async (event, toggleModStateModel: ToggleModStateModel) => {
    const appPath = app.getPath('userData');
    const appInstancePath = path.join(appPath, 'instances');
    const instances = store.get('sptInstances');
    const instance = instances.find(i => i.sptRootDirectory === toggleModStateModel.instancePath);
    if (!instance) {
      error('Instance not found');
      return;
    }

    if (!existsSync(appInstancePath)) {
      info('App global instance directory will be created');
      mkdirSync(appInstancePath);
    }

    const instanceName = toggleModStateModel.instancePath.split('\\').pop();
    if (!instanceName) {
      error('Instance name cannot be fetched');
      event.sender.send('toggle-mod-state-error');
      return;
    }

    const trackedFileData = instance.trackedMods.find(d => d.hubId === toggleModStateModel.hubId);
    if (!trackedFileData) {
      error('Mod instance not found');
      return;
    }

    try {
      if (trackedFileData.isActive) {
        removeSymLinks(appPath, instanceName, toggleModStateModel.instancePath, trackedFileData);
      } else {
        addSymLinks(appPath, instanceName, toggleModStateModel.instancePath, trackedFileData);
      }

      trackedFileData.isActive = !trackedFileData.isActive;
      store.set('sptInstances', instances);
      event.sender.send('toggle-mod-state-completed');
    } catch (e) {
      error(`Error while changing the state of mod: ${toggleModStateModel.hubId};State: ${trackedFileData.isActive} -> ${!trackedFileData.isActive}`);
      event.sender.send('toggle-mod-state-error');
    }
  });

  function removeSymLinks(appPath: string, instanceName: string, instancePath: string, trackedFileData: TrackedMod) {
    const pathsToCheck = [clientPluginModPath, serverModPath];

    pathsToCheck.forEach(modPath => {
      const fullSourcePath = path.join(appPath, 'instances', instanceName, 'mods', trackedFileData.hubId, modPath);
      if (!existsSync(fullSourcePath)) {
        return;
      }

      if (statSync(fullSourcePath).isDirectory()) {
        const modDirectory = readdirSync(fullSourcePath);

        modDirectory.forEach(modName => unlinkSync(path.join(instancePath, modPath, modName)));
      }
    });
  }

  function addSymLinks(appPath: string, instanceName: string, instancePath: string, trackedFileData: TrackedMod) {
    const pathsToCheck = [clientPluginModPath, serverModPath];

    pathsToCheck.forEach(modPath => {
      const fullSourcePath = path.join(appPath, 'instances', instanceName, 'mods', trackedFileData.hubId, modPath);
      if (!existsSync(fullSourcePath)) {
        return;
      }

      if (statSync(fullSourcePath).isDirectory()) {
        const modDirectory = readdirSync(fullSourcePath);

        modDirectory.forEach(modName => {
          const sourceModPath = path.join(fullSourcePath, modName);
          const targetModPath = path.join(instancePath, modPath, modName);

          symlinkSync(sourceModPath, targetModPath);
        });
      }
    });
  }
};

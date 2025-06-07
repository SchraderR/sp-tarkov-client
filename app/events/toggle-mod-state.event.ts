import { app, ipcMain } from 'electron';
import * as path from 'path';
import { ToggleModStateModel } from '../../shared/models/toggle-mod-state.model';
import { existsSync, mkdirSync, readdirSync, rm, rmSync, statSync } from 'fs-extra';
import * as Store from 'electron-store';
import { SptInstance, UserSettingStoreModel } from '../../shared/models/user-setting.model';
import { error, info, log } from 'electron-log';
import { clientPluginModPath, serverModPath } from '../constants';
import { symlinkSync } from 'node:fs';
import { TrackedMod } from '../../shared/models/tracked-mod.model';

export const toggleModStateEvent = (store: Store<UserSettingStoreModel>) => {
  ipcMain.on('toggle-mod-state', async (event, toggleModStateModel: ToggleModStateModel) => {
    const appPath = app.getPath('userData');
    const appInstancePath = path.join(appPath, 'instances');
    const instances = store.get('sptInstances');
    const instance = instances.find(i => i.sptRootDirectory === toggleModStateModel.instancePath);
    if (!instance) {
      error('ToggleModState: Instance not found');
      return;
    }

    if (!existsSync(appInstancePath)) {
      info('ToggleModState: App global instance directory will be created');
      mkdirSync(appInstancePath);
    }

    const instanceName = toggleModStateModel.instancePath.split('\\').pop();
    if (!instanceName) {
      error('ToggleModState: Instance name cannot be fetched');
      event.sender.send('toggle-mod-state-error');
      return;
    }

    const trackedFileData = instance.trackedMods.find(d => d.hubId === toggleModStateModel.hubId);
    if (!trackedFileData) {
      error('ToggleModState: Mod instance not found');
      return;
    }

    if (!toggleModStateModel.remove) {
      changeModState(appPath, instances, instanceName, trackedFileData, toggleModStateModel, event, store);
    } else {
      removeMod(appPath, instances, instanceName, trackedFileData, toggleModStateModel, event, store);
    }
  });

  function removeMod(
    appPath: string,
    instances: SptInstance[],
    instanceName: string,
    trackedFileData: TrackedMod,
    toggleModStateModel: ToggleModStateModel,
    event: Electron.IpcMainEvent,
    store: Store<UserSettingStoreModel>
  ) {
    try {
      const removeModPath = path.join(appPath, 'instances', instanceName, 'mods', trackedFileData.hubId.toString());
      log(`HubId:${toggleModStateModel.hubId} - Path: ${removeModPath}`);

      removeSymLinks(appPath, instanceName, toggleModStateModel.instancePath, trackedFileData);
      rm(removeModPath, { recursive: true }).then(() => {
        log(`HubId:${toggleModStateModel.hubId} - Mod data removed`);
        const instance = instances.find(i => i.sptRootDirectory === toggleModStateModel.instancePath);
        if (!instance) {
          error('ToggleModState: Mod instance not found');
          return;
        }

        instance.trackedMods = instance.trackedMods.filter(m => m.hubId !== trackedFileData.hubId);
        store.set('sptInstances', instances);
        event.sender.send('toggle-mod-state-completed');
      });
    } catch (e) {
      error(`HubId:${toggleModStateModel.hubId} - Error while removing mod files and symlink`, e);
      event.sender.send('toggle-mod-state-error');
    }
  }

  function changeModState(
    appPath: string,
    instances: SptInstance[],
    instanceName: string,
    trackedFileData: TrackedMod,
    toggleModStateModel: ToggleModStateModel,
    event: Electron.IpcMainEvent,
    store: Store<UserSettingStoreModel>
  ) {
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
      error(
        `HubId:${toggleModStateModel.hubId} - Error while changing state of mod; State: ${trackedFileData.isActive} -> ${!trackedFileData.isActive}`
      );
      event.sender.send('toggle-mod-state-error');
    }
  }

  function removeSymLinks(appPath: string, instanceName: string, instancePath: string, trackedFileData: TrackedMod) {
    const pathsToCheck = [clientPluginModPath, serverModPath];

    pathsToCheck.forEach(modPath => {
      const fullSourcePath = path.join(appPath, 'instances', instanceName, 'mods', trackedFileData.hubId.toString(), modPath);
      if (!existsSync(fullSourcePath)) {
        return;
      }

      if (statSync(fullSourcePath).isDirectory()) {
        const modDirectory = readdirSync(fullSourcePath);

        modDirectory.forEach(modName => {
          rmSync(path.join(instancePath, modPath, modName));
          log(`HubId:${trackedFileData.hubId} - SymLink: ${path.join(instancePath, modPath, modName)} removed`);
        });
      }
    });
  }

  function addSymLinks(appPath: string, instanceName: string, instancePath: string, trackedFileData: TrackedMod) {
    const pathsToCheck = [clientPluginModPath, serverModPath];

    pathsToCheck.forEach(modPath => {
      const fullSourcePath = path.join(appPath, 'instances', instanceName, 'mods', trackedFileData.hubId.toString(), modPath);
      if (!existsSync(fullSourcePath)) {
        return;
      }

      if (statSync(fullSourcePath).isDirectory()) {
        const modDirectory = readdirSync(fullSourcePath);

        modDirectory.forEach(modName => {
          const sourceModPath = path.join(fullSourcePath, modName);
          const targetModPath = path.join(instancePath, modPath, modName);

          symlinkSync(sourceModPath, targetModPath);
          log(`HubId:${trackedFileData.hubId} - SymLink created ${sourceModPath} -> ${targetModPath}`);
        });
      }
    });
  }
};

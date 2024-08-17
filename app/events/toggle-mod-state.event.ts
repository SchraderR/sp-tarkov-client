import { app, ipcMain } from 'electron';
import * as path from 'path';
import { ToggleModStateModel } from '../../shared/models/toggle-mod-state.model';
import * as log from 'electron-log';
import { ensureDirSync, existsSync, mkdirSync, move } from 'fs-extra';
import { clientPatcherModPath, clientPluginModPath, serverModPath } from '../constants';

export const toggleModStateEvent = () => {
  ipcMain.on('toggle-mod-state', async (event, toggleModStateModel: ToggleModStateModel) => {
    const appPath = app.getPath('userData');
    const appInstancePath = path.join(appPath, 'instances');
    if (!existsSync(appInstancePath)) {
      log.info('App global instance directory will be created');
      mkdirSync(appInstancePath);
    }

    const instanceName = toggleModStateModel.sptInstancePath.split('\\').pop();
    if (!instanceName) {
      log.error('Instance name cannot be fetched');
      event.sender.send('toggle-mod-state-error');
      return;
    }

    const instancePrePatcherDisabledModPath = path.join(appPath, 'instances', instanceName, 'disabled', 'prepatcher');
    const instanceClientDisabledModPath = path.join(appPath, 'instances', instanceName, 'disabled', 'client');
    const instanceServerDisabledModPath = path.join(appPath, 'instances', instanceName, 'disabled', 'server');
    let newModPath: string | null = null;

    ensureDirSync(instancePrePatcherDisabledModPath);
    ensureDirSync(instanceClientDisabledModPath);
    ensureDirSync(instanceServerDisabledModPath);

    if (toggleModStateModel.modWillBeDisabled) {
      if (toggleModStateModel.isPrePatcherMod && !toggleModStateModel.isServerMod) {
        newModPath = path.join(instancePrePatcherDisabledModPath, toggleModStateModel.modOriginalName);
      } else {
        newModPath = toggleModStateModel.isServerMod
          ? path.join(instanceServerDisabledModPath, toggleModStateModel.modOriginalName)
          : path.join(instanceClientDisabledModPath, toggleModStateModel.modOriginalName);
      }
    } else {
      if (toggleModStateModel.isPrePatcherMod && !toggleModStateModel.isServerMod) {
        newModPath = path.join(toggleModStateModel.sptInstancePath, clientPatcherModPath, toggleModStateModel.modOriginalName);
      } else {
        newModPath = toggleModStateModel.isServerMod
          ? path.join(toggleModStateModel.sptInstancePath, serverModPath, toggleModStateModel.modOriginalName)
          : path.join(toggleModStateModel.sptInstancePath, clientPluginModPath, toggleModStateModel.modOriginalName);
      }
    }

    console.log(toggleModStateModel.modOriginalName);
    console.log(toggleModStateModel.isPrePatcherMod);
    console.log(newModPath);

    move(toggleModStateModel.modOriginalPath, newModPath).then(() => {
      event.sender.send('toggle-mod-state-completed', {
        name: toggleModStateModel.modOriginalName,
        path: newModPath,
        isEnabled: !toggleModStateModel.modWillBeDisabled,
      });
    });
  });
};

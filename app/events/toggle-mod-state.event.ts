import { app, ipcMain } from 'electron';
import * as path from 'path';
import { ToggleModStateModel } from '../../shared/models/toggle-mod-state.model';
import * as log from 'electron-log';
import { moveSync, existsSync, mkdirSync, ensureDirSync } from 'fs-extra';
import { clientModPath, serverModPath } from '../constants';

export const toggleModStateEvent = () => {
  ipcMain.on('toggle-mod-state', (event, toggleModStateModel: ToggleModStateModel) => {
    const appPath = app.getPath('userData');
    const appInstancePath = path.join(appPath, 'instances');
    if (!existsSync(appInstancePath)) {
      log.info('App global instance directory will be created');
      mkdirSync(appInstancePath);
    }

    const instanceName = toggleModStateModel.akiInstancePath.split('\\').pop();
    if (!instanceName) {
      log.error('Instance name cannot be fetched');
      event.sender.send('toggle-mod-state-error');
      return;
    }

    const instanceClientDisabledModPath = path.join(appPath, 'instances', instanceName, 'disabled', 'client');
    const instanceServerDisabledModPath = path.join(appPath, 'instances', instanceName, 'disabled', 'server');
    let newModPath: string | null = null;

    ensureDirSync(instanceClientDisabledModPath);
    ensureDirSync(instanceServerDisabledModPath);

    if (toggleModStateModel.modWillBeDisabled) {
      newModPath = toggleModStateModel.isServerMod
        ? path.join(instanceServerDisabledModPath, toggleModStateModel.modOriginalName)
        : path.join(instanceClientDisabledModPath, toggleModStateModel.modOriginalName);

      moveSync(toggleModStateModel.modOriginalPath, newModPath);
    } else {
      newModPath = toggleModStateModel.isServerMod
        ? path.join(toggleModStateModel.akiInstancePath, serverModPath, toggleModStateModel.modOriginalName)
        : path.join(toggleModStateModel.akiInstancePath, clientModPath, toggleModStateModel.modOriginalName);

      moveSync(toggleModStateModel.modOriginalPath, newModPath);
    }

    event.sender.send('toggle-mod-state-completed', {
      name: toggleModStateModel.modOriginalName,
      path: newModPath,
      isEnabled: !toggleModStateModel.modWillBeDisabled,
    });
  });
};

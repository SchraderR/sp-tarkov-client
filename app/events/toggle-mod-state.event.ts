import { app, ipcMain } from 'electron';
import * as path from 'path';
import { ToggleModStateModel } from '../../shared/models/toggle-mod-state.model';
import * as log from 'electron-log';
import { moveSync, existsSync, mkdirSync, ensureDirSync } from 'fs-extra';

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

    ensureDirSync(instanceClientDisabledModPath);
    ensureDirSync(instanceServerDisabledModPath);

    if (toggleModStateModel.modWillBeDisabled) {
      moveSync(
        toggleModStateModel.modOriginalPath,
        toggleModStateModel.isServerMod
          ? path.join(instanceServerDisabledModPath, toggleModStateModel.modOriginalName)
          : path.join(instanceClientDisabledModPath, toggleModStateModel.modOriginalName)
      );
    } else {
    }

    console.log(toggleModStateModel);
    event.sender.send('toggle-mod-state-completed');
  });
};

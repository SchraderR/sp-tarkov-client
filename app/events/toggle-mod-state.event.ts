import { app, ipcMain } from 'electron';
import * as path from 'path';
import { ToggleModStateModel } from '../../shared/models/toggle-mod-state.model';
import * as log from 'electron-log';
import { existsSync, mkdirSync, ensureDirSync, move } from 'fs-extra';
import { clientPluginModPath, serverModPath } from '../constants';

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

    const instanceClientDisabledModPath = path.join(appPath, 'instances', instanceName, 'disabled', 'client');
    const instanceServerDisabledModPath = path.join(appPath, 'instances', instanceName, 'disabled', 'server');
    let newModPath: string | null = null;

    ensureDirSync(instanceClientDisabledModPath);
    ensureDirSync(instanceServerDisabledModPath);

    if (toggleModStateModel.modWillBeDisabled) {
      newModPath = toggleModStateModel.isServerMod
        ? path.join(instanceServerDisabledModPath, toggleModStateModel.modOriginalName)
        : path.join(instanceClientDisabledModPath, toggleModStateModel.modOriginalName);
    } else {
      newModPath = toggleModStateModel.isServerMod
        ? path.join(toggleModStateModel.sptInstancePath, serverModPath, toggleModStateModel.modOriginalName)
        : path.join(toggleModStateModel.sptInstancePath, clientPluginModPath, toggleModStateModel.modOriginalName);
    }

    move(toggleModStateModel.modOriginalPath, newModPath).then(() => {
      event.sender.send('toggle-mod-state-completed', {
        name: toggleModStateModel.modOriginalName,
        path: newModPath,
        isEnabled: !toggleModStateModel.modWillBeDisabled,
      });
    });
  });
};

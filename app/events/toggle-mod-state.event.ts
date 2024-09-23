import { app, ipcMain } from 'electron';
import * as path from 'path';
import { ToggleModStateModel } from '../../shared/models/toggle-mod-state.model';
import { ensureDirSync, existsSync, mkdirSync } from 'fs-extra';
import * as Store from 'electron-store';
import { UserSettingStoreModel } from '../../shared/models/user-setting.model';
import { error, info } from 'electron-log';

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

    // TODO SymLink umsetzen

    // if (!trackedFileData.isActive) {
    //   removeSync(path.join(instanceDisabledModPath, toggleModStateModel.hubId));
    // }

    // trackedFileData.isActive = !trackedFileData.isActive; // Toggle the state
    // store.set('sptInstances', instances);
    event.sender.send('toggle-mod-state-completed');
  });
};

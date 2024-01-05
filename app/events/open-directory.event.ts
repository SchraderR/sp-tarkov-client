import { dialog, ipcMain } from 'electron';
import * as fs from 'fs';
import * as Store from 'electron-store';
import { UserSettingStoreModel } from '../../shared/models/user-setting.model';
import { stableAkiServerName } from '../constants';
import { BrowserWindowSingleton } from '../browserWindow';

export const handleOpenDirectoryEvent = (store: Store<UserSettingStoreModel>) => {
  const browserWindow = BrowserWindowSingleton.getInstance();

  ipcMain.on('open-directory', event => {
    dialog.showOpenDialog(browserWindow, { properties: ['openDirectory'] }).then(selectedDirectoryValue => {
      const selectedPath = selectedDirectoryValue.filePaths[0];
      // TODO outsource
      const instance = store.get('akiInstances');
      if (!instance) {
        store.set('akiInstances', []);
      }

      if (fs.existsSync(selectedPath)) {
        const files = fs.readdirSync(selectedPath);
        const isAKiRootDirectorySoftCheck = files.some(f => f === stableAkiServerName);
        const isNewInstance = store.get('akiInstances').find(i => i.akiRootDirectory === selectedPath);
        if (isNewInstance) {
          // TODO Error handling and check invalid paths?
          return;
        }

        if (isAKiRootDirectorySoftCheck) {
          store.set('akiInstances', [...store.get('akiInstances'), { akiRootDirectory: selectedPath }]);
          event.sender.send('open-directory-completed', files);
        } else {
          // TODO ERROR HANDLING
          // TODO SOFT CHECK FALSE RE-EVALUATE
          console.error('SOFT CHECK FALSE for eft sp directory');
        }
      }
    });
  });
};

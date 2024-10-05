import { dialog, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as Store from 'electron-store';
import { UserSettingStoreModel } from '../../shared/models/user-setting.model';
import { stableSptCoreConfigPath, stableSptServerName } from '../constants';
import { BrowserWindowSingleton } from '../browserWindow';
import * as log from 'electron-log';

export const handleOpenDirectoryEvent = (store: Store<UserSettingStoreModel>) => {
  const browserWindow = BrowserWindowSingleton.getInstance();

  ipcMain.on('open-directory', event => {
    dialog.showOpenDialog(browserWindow, { properties: ['openDirectory'] }).then(selectedDirectoryValue => {
      try {
        const selectedPath = selectedDirectoryValue.filePaths[0];

        if (fs.existsSync(selectedPath)) {
          const files = fs.readdirSync(selectedPath);
          const isSptRootDirectorySoftCheck = files.some(f => stableSptServerName.includes(f));
          const isNewInstance = store.get('sptInstances').find(i => i.sptRootDirectory === selectedPath);
          if (isNewInstance) {
            event.sender.send('open-directory-error', {
              message: 'Instance with this directory already exists.',
            });
            return;
          }

          let coreJson: string = '';

          stableSptCoreConfigPath.forEach(corePath => {
            if (!fs.existsSync(path.join(selectedPath, corePath))) {
              log.error(`${corePath} not available.`);
              return;
            }

            coreJson = fs.readFileSync(path.join(selectedPath, corePath), 'utf-8');
          });

          if (isSptRootDirectorySoftCheck) {
            store.set('sptInstances', [...store.get('sptInstances'), { sptRootDirectory: selectedPath }]);
            event.sender.send('open-directory-completed', {
              sptRootDirectory: selectedPath,
              sptCore: JSON.parse(coreJson.trim()),
              isValid: true,
              isActive: false,
              clientMods: [],
              serverMods: [],
            });
          } else {
            event.sender.send('open-directory-error', {
              message: 'Unable to find Aki.Server. Please ensure EFT-SP is installed in this directory.',
            });
          }
        }
      } catch (error: any) {
        log.error(error);
        if (error.code === 'ENOENT') {
          event.sender.send('open-directory-error', {
            message: 'Could not resolve AKI Core. Please ensure that you have selected the root directory.',
          });
        } else {
          log.error(error);
          event.sender.send('open-directory-error', {
            message: 'An unknown error occurred.',
          });
        }
      }
    });
  });
};

import { dialog, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { sptServerMetadataPath, stableSptServerName } from '../constants';
import { BrowserWindowSingleton } from '../browserWindow';
import * as log from 'electron-log';
import { createInstance, findInstanceByPath } from '../database/controller/instance.controller';
import { getVersion } from '../helper/powershell.helper';

export const handleOpenDirectoryEvent = () => {
  const browserWindow = BrowserWindowSingleton.getInstance();

  ipcMain.on('open-directory', event => {
    dialog.showOpenDialog(browserWindow, { properties: ['openDirectory'] }).then(async selectedDirectoryValue => {
      try {
        const selectedPath = selectedDirectoryValue.filePaths[0];

        if (fs.existsSync(selectedPath)) {
          const files = fs.readdirSync(selectedPath, { recursive: true });
          const isSptRootDirectorySoftCheck = files.some(f => stableSptServerName.includes(f as string));
          const isNewInstance = await findInstanceByPath(selectedPath);
          if (isNewInstance) {
            event.sender.send('open-directory-error', {
              message: 'Instance with this directory already exists.',
            });
            return;
          }

          let sptVersion = '';
          if (!fs.existsSync(path.join(selectedPath, sptServerMetadataPath))) {
            log.error(
              `Error: Selected directory (${selectedPath}); Dll-Path (${sptServerMetadataPath}); ${path.join(selectedPath, sptServerMetadataPath)} not found.`
            );
            event.sender.send('open-directory-error', {
              message: `Error: ${path.join(selectedPath, sptServerMetadataPath)} not found. Please make sure to open the root SPT directory.`,
            });
            return;
          }

          try {
            sptVersion = await getVersion(path.join(selectedPath, sptServerMetadataPath));
          } catch (error) {
            log.error(error);
          }

          if (isSptRootDirectorySoftCheck) {
            const newInstance = await createInstance(selectedPath);
            if (newInstance) {
              event.sender.send('open-directory-completed', {
                id: newInstance.id,
                sptRootDirectory: selectedPath,
                sptVersion: sptVersion,
                isValid: true,
                isActive: false,
                clientMods: [],
                serverMods: [],
              });
            } else {
              event.sender.send('open-directory-error', {
                message: 'Failed to create instance in database.',
              });
            }
          } else {
            event.sender.send('open-directory-error', {
              message: 'Unable to find SPT.Server. Please ensure EFT-SP is installed in this directory.',
            });
          }
        }
      } catch (error: any) {
        log.error(error);
        if (error.code === 'ENOENT') {
          event.sender.send('open-directory-error', {
            message: 'Could not resolve SPT Core. Please ensure that you have selected the root directory.',
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

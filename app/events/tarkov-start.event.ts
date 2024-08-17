import { ipcMain } from 'electron';
import * as path from 'path';
import * as child from 'child_process';
import { spawn } from 'node:child_process';
import * as log from 'electron-log';
import { existsSync } from 'fs-extra';

const exeNameAki = 'Aki.Server.exe';
const exeNameSpt = 'SPT.Server.exe';

export const handleTarkovStartEvent = () => {
  ipcMain.on('tarkov-start', (event, sptInstancePath: string) => {
    let child: child.ChildProcess;

    try {
      let filePath = path.join(sptInstancePath, exeNameAki);
      if (!existsSync(filePath)) {
        filePath = path.join(sptInstancePath, exeNameSpt);
      }

      child = spawn(filePath, [], {
        cwd: sptInstancePath,
        detached: false, // run the child process in the background as a service
        windowsHide: true, // hide the console window on Windows
      });

      child.stdout?.on('data', data => event.sender.send('server-output', data.toString()));
      child.stderr?.on('data', data => console.error(data.toString()));

      child.on('exit', code => console.log(`Child exited with code ${code}`));
      child!.unref();
    } catch (e) {
      log.error(e);
    }

    event.sender.send('tarkov-start-completed');
  });
};

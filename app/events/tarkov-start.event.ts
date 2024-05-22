import { ipcMain } from 'electron';
import * as path from 'path';
import * as child from 'child_process';
import { spawn } from 'node:child_process';
import * as log from 'electron-log';

const exeName = 'Aki.Server.exe';

export const handleTarkovStartEvent = () => {
  ipcMain.on('tarkov-start', (event, akiInstancePath: string) => {
    let child: child.ChildProcess;

    try {
      child = spawn(path.join(akiInstancePath, exeName), [], {
        cwd: akiInstancePath,
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

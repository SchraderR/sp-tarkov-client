import { ipcMain } from 'electron';
import { spawn } from 'node:child_process';
import * as path from 'path';
import * as child from 'child_process';
import * as log from 'electron-log';

const exeNameSpt = 'SPT.Server.exe';

export const handleTarkovStartEvent = () => {
  ipcMain.on('tarkov-start', (event, sptInstancePath: string) => {
    let child: child.ChildProcess;

    try {
      const sptFolder = path.join(sptInstancePath, 'SPT');

      child = spawn(path.join(sptFolder, exeNameSpt), [], {
        cwd: sptFolder,
        env: { ...process.env, DISABLE_VIRTUAL_TERMINAL: '1' },
        detached: false,
        windowsHide: true,
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

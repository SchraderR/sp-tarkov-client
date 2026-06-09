import { ipcMain } from 'electron';
import { spawn } from 'node:child_process';
import * as path from 'path';
import * as log from 'electron-log';
import { clearServerProcess, isServerRunning, killServerProcess, setServerProcess } from '../helper/server-process.helper';

const exeNameSpt = 'SPT.Server.exe';

export const handleTarkovServerEvents = () => {
  ipcMain.on('server-start', (event, sptInstancePath: string) => {
    try {
      if (isServerRunning()) {
        event.sender.send('server-start-completed');
        return;
      }

      const sptFolder = path.join(sptInstancePath, 'SPT');

      const child = spawn(path.join(sptFolder, exeNameSpt), [], {
        cwd: sptFolder,
        env: { ...process.env, DISABLE_VIRTUAL_TERMINAL: '1' },
        detached: false,
        windowsHide: true,
      });

      setServerProcess(child);

      child.stdout?.on('data', data => event.sender.send('server-output', data.toString()));
      child.stderr?.on('data', data => event.sender.send('server-output', data.toString()));

      child.on('exit', code => {
        clearServerProcess();
        event.sender.send('server-exit', code);
      });

      child.on('error', err => {
        clearServerProcess();
        event.sender.send('server-output', `Failed to start server: ${err.message}\n`);
        event.sender.send('server-exit', -1);
      });
    } catch (e) {
      clearServerProcess();
      log.error(e);
    }

    event.sender.send('server-start-completed');
  });

  ipcMain.on('server-stop', async event => {
    try {
      await killServerProcess();
    } catch (e) {
      log.error('Failed to stop server', e);
    }

    event.sender.send('server-stop-completed');
  });
};

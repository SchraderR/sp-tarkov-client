import { ipcMain } from 'electron';
import * as path from 'path';
import * as child from 'child_process';
import { spawn } from 'node:child_process';

const exeName = 'Aki.Server.exe';

export const handleTarkovStartEvent = () => {
  ipcMain.on('tarkov-start', (event, akiInstancePath: string) => {
    console.log(akiInstancePath);
    let child: child.ChildProcess;
    console.log(path.join(akiInstancePath, exeName));

    try {
      child = spawn(path.join(akiInstancePath, exeName), [], {
        cwd: akiInstancePath,
        detached: false, // run the child process in the background as a service
        windowsHide: true, // hide the console window on Windows
      });
      child.stdout?.on('data', data => console.log(data.toString()));
      child.stderr?.on('data', data => console.log(data.toString()));
      child.on('exit', code => console.log(`Child exited with code ${code}`));
      child!.unref();
    } catch (e) {
      console.log(e?.toString());
    }

    event.sender.send('tarkov-start-completed');
  });
};

import { ChildProcess, exec } from 'child_process';
import * as log from 'electron-log';

let serverProcess: ChildProcess | null = null;

export function setServerProcess(process: ChildProcess): void {
  serverProcess = process;
}

export function clearServerProcess(): void {
  serverProcess = null;
}

export function isServerRunning(): boolean {
  return serverProcess !== null;
}

export function killServerProcess(): Promise<void> {
  return new Promise(resolve => {
    const process = serverProcess;
    if (!process || !process.pid) {
      resolve();
      return;
    }

    if (global.process.platform === 'win32') {
      exec(`taskkill /PID ${process.pid} /T /F`, error => {
        if (error) {
          log.error('Failed to taskkill server process, falling back to kill()', error);
          process.kill();
        }
        resolve();
      });
    } else {
      process.kill();
      resolve();
    }
  });
}

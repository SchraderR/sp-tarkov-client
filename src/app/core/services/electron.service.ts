import { Injectable } from '@angular/core';
import { ipcRenderer, webFrame } from 'electron';
import * as childProcess from 'child_process';
import * as fs from 'fs';
import { Observable } from 'rxjs';
import IpcRendererEvent = Electron.IpcRendererEvent;
import { applicationElectronCompleteEventNames, applicationElectronEventNames } from '../events/electron.events';

@Injectable({
  providedIn: 'root',
})
export class ElectronService {
  ipcRenderer!: typeof ipcRenderer;
  webFrame!: typeof webFrame;
  childProcess!: typeof childProcess;
  fs!: typeof fs;
  shell!: Electron.Shell;

  get isElectron(): boolean {
    return !!(window && window.process && window.process.type);
  }

  constructor() {
    this.initialElectronConfig();
  }

  sendEvent<T, C = any>(eventName: applicationElectronEventNames, eventCompleteName: applicationElectronCompleteEventNames, isResponseJson = false, parameter?: C) {
    return new Observable<null | { event: any; args: T }>(observer => {
      const handler = (event: IpcRendererEvent, args: T) => {
        const argsParsed = isResponseJson ? (JSON.parse(args as string) as T) : args;
        observer.next({ event, args: argsParsed });
        observer.complete();
      };

      this.ipcRenderer.send(eventName, parameter);
      this.ipcRenderer.on(eventCompleteName, handler);
    });
  }

  private initialElectronConfig() {
    if (!this.isElectron) {
      return;
    }

    this.ipcRenderer = window.require('electron').ipcRenderer;
    this.webFrame = window.require('electron').webFrame;
    this.fs = window.require('fs');
    this.shell = window.require('electron').shell;

    this.childProcess = window.require('child_process');
    this.childProcess.exec('node -v', (error, stdout, stderr) => {
      if (error) {
        console.error(`error: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`stderr: ${stderr}`);
        return;
      }
      console.log(`stdout:\n${stdout}`);
    });
  }
}

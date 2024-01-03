import { Injectable } from '@angular/core';
import { ipcRenderer, webFrame } from 'electron';
import * as childProcess from 'child_process';
import * as fs from 'fs';
import { Observable } from 'rxjs';
import { applicationElectronEventNames, ApplicationElectronFileError, applicationElectronFileProgressEventNames } from '../events/electron.events';
import IpcRendererEvent = Electron.IpcRendererEvent;
import { DownloadProgress , InstallProgress } from '../models/mod';

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

  sendEvent<T, C = any>(eventName: applicationElectronEventNames, parameter?: C, isResponseJson = false) {
    return new Observable<{ event: any; args: T }>(observer => {
      const handler = (event: IpcRendererEvent, args: T) => {
        const argsParsed = isResponseJson ? (JSON.parse(args as string) as T) : args;
        observer.next({ event, args: argsParsed });
        observer.complete();
      };

      this.ipcRenderer.send(eventName, parameter);

      this.ipcRenderer.once(`${eventName}-completed`, handler);
      this.ipcRenderer.once(`${eventName}-error`, (_, error: ApplicationElectronFileError) => observer.error(error));
    });
  }

  getDownloadModProgressForFileId(eventName: applicationElectronFileProgressEventNames = 'download-mod-progress'): Observable<DownloadProgress> {
    return new Observable(observer => {
      const handler = (_: IpcRendererEvent, args: DownloadProgress) => {
        if (args.percent === 1) {
          observer.next(args);
          observer.complete();
        }
        observer.next(args);
      };

      this.ipcRenderer.on(`${eventName}`, handler);
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

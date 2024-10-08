import { Injectable } from '@angular/core';
import { ipcRenderer, webFrame } from 'electron';
import * as childProcess from 'child_process';
import * as fs from 'fs';
import { Observable } from 'rxjs';
import {
  applicationElectronEventNames,
  ApplicationElectronFileError,
  applicationElectronFileProgressEventNames,
  applicationTarkovInstanceOutputEventNames,
} from '../events/electron.events';
import { DownloadBase, GithubRateLimit } from '../../../../shared/models/download.model';
import IpcRendererEvent = Electron.IpcRendererEvent;

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

  openExternal = (url: string) => void this.shell.openExternal(url);
  openPath = (path: string) => void this.shell.openPath(path);

  sendEvent<T, C = never>(eventName: applicationElectronEventNames, parameter?: C, id?: string, isResponseJson = false) {
    return new Observable<{ event: unknown; args: T }>(observer => {
      const handler = (event: IpcRendererEvent, args: T) => {
        const argsParsed = isResponseJson ? (JSON.parse(args as string) as T) : args;
        this.ipcRenderer.removeAllListeners(`${eventName}-completed${id ? `-${id}` : ''}`);
        this.ipcRenderer.removeAllListeners(`${eventName}-error${id ? `-${id}` : ''}`);
        this.ipcRenderer.removeAllListeners(eventName);
        observer.next({ event, args: argsParsed });
        observer.complete();
      };

      this.ipcRenderer.send(eventName, parameter, id);

      this.ipcRenderer.once(`${eventName}-completed${id ? `-${id}` : ''}`, handler);
      this.ipcRenderer.once(`${eventName}-error${id ? `-${id}` : ''}`, (_, error: ApplicationElectronFileError) => {
        this.ipcRenderer.removeAllListeners(`${eventName}-completed${id ? `-${id}` : ''}`);
        this.ipcRenderer.removeAllListeners(`${eventName}-error${id ? `-${id}` : ''}`);
        this.ipcRenderer.removeAllListeners(eventName);
        observer.error(error);
      });
    });
  }

  getDownloadModProgressForFileId<T extends DownloadBase = never>(
    eventName: applicationElectronFileProgressEventNames = 'download-mod-progress'
  ): Observable<T> {
    return new Observable(observer => {
      const handler = (_: IpcRendererEvent, args: T) => {
        if (args?.percent === 1) {
          observer.next(args);
          observer.complete();
        }
        observer.next(args);

        if (eventName === 'download-mod-direct' || eventName === 'download-mod-direct-completed') {
          observer.complete();
        }
      };

      this.ipcRenderer.on(`${eventName}`, handler);
    });
  }

  getServerOutput(eventName: applicationTarkovInstanceOutputEventNames = 'server-output'): Observable<string> {
    return new Observable(observer => {
      const handler = (_: IpcRendererEvent, args: string) => {
        observer.next(args);

        if (eventName === 'server-output-completed') {
          observer.complete();
        }
      };

      this.ipcRenderer.on(`${eventName}`, handler);
    });
  }

  getGithubRateLimitInformation(): Observable<GithubRateLimit> {
    return new Observable(observer => {
      const handler = (_: IpcRendererEvent, args: GithubRateLimit) => {
        observer.next(args);
        observer.complete();
      };

      this.ipcRenderer.on('github-ratelimit-information', handler);
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
    });
  }
}

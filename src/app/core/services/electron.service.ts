import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  applicationElectronEventNames,
  ApplicationElectronFileError,
  applicationElectronFileProgressEventNames,
  applicationTarkovInstanceOutputEventNames,
} from '../events/electron.events';
import { DownloadBase, GithubRateLimit } from '../../../../shared/models/download.model';

@Injectable({
  providedIn: 'root',
})
export class ElectronService {
  private get electronApi(): ElectronAPI {
    return window.electronAPI;
  }

  get isElectron(): boolean {
    return !!window.electronAPI;
  }

  openExternal = (url: string) => void this.electronApi.openExternal(url);
  openPath = (path: string) => void this.electronApi.openPath(path);

  sendEvent<T, C = never>(eventName: applicationElectronEventNames, parameter?: C, id?: string, isResponseJson = false) {
    return new Observable<{ event: unknown; args: T }>(observer => {
      const completedChannel = `${eventName}-completed${id ? `-${id}` : ''}`;
      const errorChannel = `${eventName}-error${id ? `-${id}` : ''}`;

      const cleanup = () => {
        this.electronApi.removeAllListeners(completedChannel);
        this.electronApi.removeAllListeners(errorChannel);
        this.electronApi.removeAllListeners(eventName);
      };

      const handler = (event: unknown, ...rest: unknown[]) => {
        const args = rest[0] as T;
        const argsParsed = isResponseJson ? (JSON.parse(args as string) as T) : args;
        cleanup();
        observer.next({ event, args: argsParsed });
        observer.complete();
      };

      this.electronApi.send(eventName, parameter, id);
      this.electronApi.once(completedChannel, handler);
      this.electronApi.once(errorChannel, (_event: unknown, ...rest: unknown[]) => {
        cleanup();
        observer.error(rest[0] as ApplicationElectronFileError);
      });
    });
  }

  getDownloadModProgressForFileId<T extends DownloadBase = never>(
    eventName: applicationElectronFileProgressEventNames = 'download-mod-progress'
  ): Observable<T> {
    return new Observable(observer => {
      const handler = (_: unknown, ...rest: unknown[]) => {
        const args = rest[0] as T;
        if (args?.percent === 1) {
          observer.next(args);
          observer.complete();
        }
        observer.next(args);

        if (eventName === 'download-mod-direct' || eventName === 'download-mod-direct-completed') {
          observer.complete();
        }
      };

      this.electronApi.on(eventName, handler);
    });
  }

  getServerOutput(eventName: applicationTarkovInstanceOutputEventNames = 'server-output'): Observable<string> {
    return new Observable(observer => {
      const handler = (_: unknown, ...rest: unknown[]) => {
        observer.next(rest[0] as string);

        if (eventName === 'server-output-completed') {
          observer.complete();
        }
      };

      this.electronApi.on(eventName, handler);
    });
  }

  getGithubRateLimitInformation(): Observable<GithubRateLimit> {
    return new Observable(observer => {
      const handler = (_: unknown, ...rest: unknown[]) => {
        observer.next(rest[0] as GithubRateLimit);
        observer.complete();
      };

      this.electronApi.on('github-ratelimit-information', handler);
    });
  }
}

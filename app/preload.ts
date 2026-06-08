import { contextBridge, ipcRenderer } from 'electron';
import type { IpcRendererEvent } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  send: (channel: string, ...args: unknown[]) => ipcRenderer.send(channel, ...args),
  on: (channel: string, listener: (event: IpcRendererEvent, ...args: unknown[]) => void) => ipcRenderer.on(channel, listener),
  once: (channel: string, listener: (event: IpcRendererEvent, ...args: unknown[]) => void) => ipcRenderer.once(channel, listener),
  removeAllListeners: (channel: string) => ipcRenderer.removeAllListeners(channel),
  openExternal: (url: string) => ipcRenderer.invoke('shell:open-external', url),
  openPath: (path: string) => ipcRenderer.invoke('shell:open-path', path),
});

import { ipcMain } from 'electron';
import { BrowserWindowSingleton } from '../browserWindow';

export interface TrackedFile {
  hubId: string;
  lastUpdateCheck: string;
  isActive: true;
  files: string[];
}

export const fileTrackingEvents = () => {
  ipcMain.on('window-close', () => BrowserWindowSingleton.getInstance().close());
};

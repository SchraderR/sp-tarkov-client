import { ipcMain } from 'electron';
import { BrowserWindowSingleton } from '../browserWindow';

export interface TrackedMods {
  modName: string;
  hubId: string;
  modVersion?: string;
  nextUpdateCheck: string;
  isActive: boolean;
}

export const fileTrackingEvents = () => {
  ipcMain.on('window-close', () => BrowserWindowSingleton.getInstance().close());
};

import { ipcMain, shell } from 'electron';

export const handleShellEvents = (): void => {
  ipcMain.handle('shell:open-external', (_, url: string) => shell.openExternal(url));
  ipcMain.handle('shell:open-path', (_, path: string) => shell.openPath(path));
};

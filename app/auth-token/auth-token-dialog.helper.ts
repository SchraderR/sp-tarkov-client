import * as log from 'electron-log';
import * as path from 'path';
import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import { hasAuthToken, registerAuthToken, removeAuthToken } from './auth-token.helper';
import { environment } from '../environment';

const API_PERMISSIONS_ENDPOINT = environment.forgeApiAuthEndpoint;
const API_PERMISSION_ACCEPTED_VALUE = 'read';
const API_PERMISSION_ACCEPTED_LENGTH = 1;

interface PermissionResponse {
  success: boolean;
  data: string[];
}

export async function showAuthKeyDialog(): Promise<void> {
  const result = await dialog.showMessageBox({
    type: 'info',
    title: 'API Key Required',
    message: 'Please enter your API key',
    detail: 'This application requires an API key with read-only permissions to function. The key will be encrypted and stored securely on your computer.',
    buttons: ['Enter API Key', 'Exit'],
    defaultId: 0,
    cancelId: 1,
  });

  if (result.response === 1) {
    return Promise.reject();
  }

  return await promptForApiKey();
}

async function validateApiPermissions(token: string): Promise<{ isValid: boolean; permissions: string[]; error?: string }> {
  try {
    const response = await fetch(`${environment.forgeBasePath}${API_PERMISSIONS_ENDPOINT}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        return { isValid: false, permissions: [], error: 'INVALID_TOKEN' };
      }
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data: PermissionResponse = await response.json();

    if (!data.success) {
      log.error('API returned success: false');
      return { isValid: false, permissions: [], error: 'INVALID_TOKEN' };
    }

    const hasOnlyReadPermission = data.data.length === API_PERMISSION_ACCEPTED_LENGTH && data.data.includes(API_PERMISSION_ACCEPTED_VALUE);
    if (!hasOnlyReadPermission) {
      log.warn('Token has invalid permissions:', data.data);
      return {
        isValid: false,
        permissions: data.data,
        error: 'INVALID_PERMISSIONS',
      };
    }

    return { isValid: true, permissions: data.data };
  } catch (error) {
    log.error('Failed to validate API permissions:', error);
    return { isValid: false, permissions: [], error: 'NETWORK_ERROR' };
  }
}

async function promptForApiKey(): Promise<void> {
  return new Promise<void>(async (resolve, reject) => {
    const inputWindow = new BrowserWindow({
      width: 500,
      height: 750,
      modal: true,
      resizable: true,
      autoHideMenuBar: true,
      frame: true,
      minimizable: false,
      maximizable: false,
      alwaysOnTop: true,
      center: true,
      title: 'SP-EFT Manager Auth Key Setup',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
      },
    });

    ipcMain.handle('validate-and-save-token', async (event, token: string) => {
      try {
        const validation = await validateApiPermissions(token);
        if (!validation.isValid) {
          if (await hasAuthToken()) {
            await removeAuthToken();
          }

          const formattedPermissions = validation.permissions.map(p => p.toLowerCase());
          return {
            success: false,
            error: validation.error,
            permissions: formattedPermissions,
          };
        }

        const saved = await registerAuthToken(token);
        if (!saved) {
          return {
            success: false,
            error: 'SAVE_ERROR',
          };
        }

        return {
          success: true,
          permissions: validation.permissions,
        };
      } catch (error) {
        log.error('Error in validate-and-save-token:', error);
        return {
          success: false,
          error: 'UNKNOWN_ERROR',
        };
      }
    });

    ipcMain.handle('close-auth-window', () => inputWindow.close());
    ipcMain.handle('quit-app', () => app.quit());

    const htmlPath = path.join(__dirname, 'auth-token.html');
    await inputWindow.loadFile(htmlPath);

    inputWindow.on('closed', async () => {
      ipcMain.removeHandler('validate-and-save-token');
      ipcMain.removeHandler('close-auth-window');
      ipcMain.removeHandler('quit-app');
      resolve();
    });
  });
}

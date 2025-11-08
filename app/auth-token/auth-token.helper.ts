import { safeStorage, session } from 'electron';
import * as log from 'electron-log';
import { getUserSettingProperty, setUserSettingProperty } from '../database/controller/user-setting.controller';
import { environment } from '../../src/environments/environment';

export async function hasAuthToken(): Promise<boolean> {
  return !!(await getUserSettingProperty('authKey'));
}

export function registerAuthTokenHeaderInterceptor() {
  session.defaultSession.webRequest.onBeforeSendHeaders({ urls: [`${environment.forgeBasePath}*`] }, async (details, callback) => {
    const authToken = await getAuthToken();
    if (authToken) {
      details.requestHeaders['Authorization'] = `Bearer ${authToken}`;
    }

    callback({ requestHeaders: details.requestHeaders });
  });
}

export async function registerAuthToken(authToken: string) {
  if (safeStorage.isEncryptionAvailable()) {
    const encrypted = safeStorage.encryptString(authToken);
    await setUserSettingProperty('authKey', encrypted.toString('base64'));
    return { success: true };
  } else {
    console.warn('Encryption not available, storing in plaintext');
    await setUserSettingProperty('authKey', authToken);
    return { success: false, warning: 'No encryption available' };
  }
}

export async function removeAuthToken() {
  await setUserSettingProperty('authKey', null);
}

async function getAuthToken(): Promise<string | null> {
  const storedToken = await getUserSettingProperty('authKey');
  if (!storedToken) {
    log.error('No auth token found');
    return null;
  }

  if (safeStorage.isEncryptionAvailable()) {
    try {
      const buffer = Buffer.from(storedToken, 'base64');
      return safeStorage.decryptString(buffer);
    } catch (error) {
      log.error('Failed to decrypt token');
      return null;
    }
  }

  return storedToken;
}

import log from 'electron-log';
import { getDataSource } from '../data-source';
import { UserSettingEntity } from '../entity/UserSetting';
import { IsNull, Not } from 'typeorm';

const SENSITIVE_PROPERTIES: Set<keyof Omit<UserSettingEntity, 'id'>> = new Set(['authKey']);

export async function ensureUserSettings(): Promise<UserSettingEntity | null> {
  try {
    const dataSource = await getDataSource();
    const exists = await dataSource.manager.exists(UserSettingEntity);

    if (!exists) {
      log.info('No user settings found, creating initial settings');
      return await createInitialUserSettings();
    }

    return await dataSource.manager.findOneOrFail(UserSettingEntity, { where: { id: Not(IsNull()) } });
  } catch (error) {
    log.error('Error ensuring user settings:', error);
    return null;
  }
}

export async function getUserSettings(): Promise<UserSettingEntity | null> {
  try {
    const dataSource = await getDataSource();

    return await dataSource.manager.findOneOrFail(UserSettingEntity, { where: { id: Not(IsNull()) } });
  } catch (error) {
    log.error('Error getting user settings:', error);
    return null;
  }
}

export async function getUserSettingProperty<K extends keyof Omit<UserSettingEntity, 'id'>>(property: K): Promise<UserSettingEntity[K] | null> {
  try {
    const settings = await getUserSettings();
    return settings ? settings[property] : null;
  } catch (error) {
    log.error(`Error getting user setting property ${String(property)}:`, error);
    return null;
  }
}

export async function setUserSettingProperty<K extends keyof Omit<UserSettingEntity, 'id'>>(property: K, value: UserSettingEntity[K]): Promise<boolean> {
  try {
    const dataSource = await getDataSource();
    const settings = await getUserSettings();

    if (!settings) {
      log.error('No user settings found to update');
      return false;
    }

    await dataSource.manager.update(UserSettingEntity, { id: settings.id }, { [property]: value });

    if (SENSITIVE_PROPERTIES.has(property)) {
      log.info(`User setting property ${String(property)} updated (sensitive data hidden)`);
    } else {
      log.info(`User setting property ${String(property)} updated; Old value: ${settings[property]}, New value: ${value}`);
    }
    return true;
  } catch (error) {
    log.error(`Error setting user setting property ${String(property)}:`, error);
    return false;
  }
}

async function createInitialUserSettings(): Promise<UserSettingEntity | null> {
  try {
    const dataSource = await getDataSource();

    const initialSettings = dataSource.manager.create(UserSettingEntity, {
      theme: 'system',
      isTutorialDone: false,
      isExperimentalFunctionsActive: false,
      keepTempDownloadDirectory: false,
      authKey: null,
    });

    const savedSettings = await dataSource.manager.save(UserSettingEntity, initialSettings);
    log.info('Initial user settings created successfully');

    return savedSettings;
  } catch (error) {
    log.error('Error creating initial user settings:', error);
    return null;
  }
}

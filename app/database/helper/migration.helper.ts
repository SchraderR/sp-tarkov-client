import * as Store from 'electron-store';
import * as log from 'electron-log';
import { DataSource } from 'typeorm';
import { UserSettingStoreModel } from '../../../shared/models/user-setting.model';
import { getDataSource } from '../data-source';
import { UserSettingEntity } from '../entity/UserSetting';
import { InstanceEntity } from '../entity/Instance';

interface MigrationResult {
  success: boolean;
  migratedInstances: number;
  migratedSettings: boolean;
  errors: string[];
}

interface SettingsMigrationResult {
  success: boolean;
  error?: string;
}

interface InstancesMigrationResult {
  count: number;
  error?: string;
}

/**
 * Migrates data from electron-store to SQLite database
 * @param store - Electron store instance
 * @returns Promise<MigrationResult> - Result
 */
export async function migrateStoreToSQLiteDb(store: Store<UserSettingStoreModel>): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: false,
    migratedInstances: 0,
    migratedSettings: false,
    errors: [],
  };

  try {
    log.info('Starting migration process');
    if (store.get('migrated') === true) {
      log.info('Migration already completed. Skipping.');
      result.success = true;
      return result;
    }
    const dbSource = await getDataSource();

    const instancesResult = await migrateInstances(store, dbSource);
    result.migratedInstances = instancesResult.count;
    if (instancesResult.error) {
      result.errors.push(instancesResult.error);
    }

    const settingsResult = await migrateUserSettings(store, dbSource);
    result.migratedSettings = settingsResult.success;
    if (settingsResult.error) {
      result.errors.push(settingsResult.error);
    }

    store.set('migrated', true);
    result.success = result.errors.length === 0;
    log.info(`Migration completed. Instances: ${result.migratedInstances}, Settings: ${result.migratedSettings}, Errors: ${result.errors.length}`);

    return result;
  } catch (error) {
    const errorMessage = `Critical error during migration: ${error instanceof Error ? error.message : String(error)}`;
    log.error(errorMessage, error);
    result.errors.push(errorMessage);
    result.success = false;
    return result;
  }
}

/**
 * Migrate user settings
 * @param store -Electron store instance
 * @param dbSource - DataSource
 * @returns Promise<SettingsMigrationResult>
 */
async function migrateUserSettings(store: Store<UserSettingStoreModel>, dbSource: DataSource): Promise<SettingsMigrationResult> {
  try {
    log.info('Starting user settings migration');

    const userSettingExists = await dbSource.manager.exists(UserSettingEntity);
    if (userSettingExists) {
      log.info('User settings already exist in database. Skipping.');
      return { success: true };
    }

    const userSetting = dbSource.manager.create(UserSettingEntity, {
      theme: store.get('theme'),
      isTutorialDone: store.get('isTutorialDone', false),
      isExperimentalFunctionsActive: store.get('isExperimentalFunctionsActive', false),
      keepTempDownloadDirectory: store.get('keepTempDownloadDirectory', false),
    });

    await dbSource.manager.save(UserSettingEntity, userSetting);
    log.info('User settings migrated successfully');

    return { success: true };
  } catch (error) {
    const errorMessage = `Error migrating user settings: ${error instanceof Error ? error.message : String(error)}`;
    log.error(errorMessage, error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Migrate SPT instances
 * @param store - Electron store instance
 * @param dbSource - DataSource
 * @returns Promise<InstancesMigrationResult>
 */
async function migrateInstances(
  store: Store<UserSettingStoreModel>,
  dbSource: DataSource
): Promise<InstancesMigrationResult> {
  let migratedCount = 0;

  try {
    log.info('Starting instances migration');

    const instances = store.get('sptInstances', []);
    log.info(`Found ${instances.length} instance(s) to migrate`);

    if (instances.length === 0) {
      log.info('No instances to migrate');
      return { count: 0 };
    }

    await dbSource.transaction(async (transactionalEntityManager) => {
      for (const instance of instances) {
        try {
          await migrateInstanceItem(instance, transactionalEntityManager);
          migratedCount++;
        } catch (error) {
          log.warn(`Failed to migrate instance at path: ${instance.sptRootDirectory}`, error);
        }
      }
    });

    log.info(`Successfully migrated ${migratedCount} of ${instances.length} instance(s)`);
    return { count: migratedCount };
  } catch (error) {
    const errorMessage = `Error during instances migration: ${error instanceof Error ? error.message : String(error)}`;
    log.error(errorMessage, error);
    return { count: migratedCount, error: errorMessage };
  }
}

async function migrateInstanceItem(instance: { sptRootDirectory: string; isActive: boolean }, entityManager: DataSource["manager"]): Promise<void> {
  log.info(`Migrating instance: ${instance.sptRootDirectory}`);
  const instanceExists = await entityManager.exists(InstanceEntity, { where: { sptRootDirectory: instance.sptRootDirectory } });

  if (instanceExists) {
    log.info(`Instance already exists: ${instance.sptRootDirectory}. Skipping.`);
    return;
  }

  const newInstance = entityManager.create(InstanceEntity, {
    sptRootDirectory: instance.sptRootDirectory,
    isActive: instance.isActive,
  });

  await entityManager.save(InstanceEntity, newInstance);
  log.info(`Instance migrated successfully: ${instance.sptRootDirectory}`);
}

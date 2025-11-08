import * as Store from 'electron-store';
import { migrateStoreToSQLiteDb } from './migration.helper';
import { AppDataSource } from '../data-source';
import { UserSettingStoreModel } from '../../../shared/models/user-setting.model';
import * as log from 'electron-log';

export async function initializeDatabaseAndMigration(store: Store<UserSettingStoreModel>): Promise<void> {
  AppDataSource.initialize()
    .then(() => log.info('Connection initialized with database...'))
    .catch(error => log.error(error));

  void migrateStoreToSQLiteDb(store);
}

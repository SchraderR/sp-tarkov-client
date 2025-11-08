import * as Store from 'electron-store';
import { migrateStoreToSQLiteDb } from './migration.helper';
import { AppDataSource } from '../data-source';
import { UserSettingStoreModel } from '../../../shared/models/user-setting.model';

export async function initializeDatabaseAndMigration(store: Store<UserSettingStoreModel>): Promise<void> {
  AppDataSource.initialize()
    .then(() => console.log('Connection initialized with database...'))
    .catch(error => console.log(error));

  void migrateStoreToSQLiteDb(store);
}

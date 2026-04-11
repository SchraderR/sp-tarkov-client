import { AppDataSource } from '../data-source';
import * as log from 'electron-log';

export async function initializeDatabase(): Promise<void> {
  AppDataSource.initialize()
    .then(() => log.info('Connection initialized with database...'))
    .catch(error => log.error(error));
}

import "reflect-metadata"
import { DataSource } from "typeorm"
import { app } from 'electron';
import { CoreEntity } from './entity/Core';
import { InstanceEntity } from './entity/Instance';

const appPath = app.getPath('userData');
console.log(appPath);
export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: `${appPath}\\database.sqlite`,
  synchronize: true,
  logging: false,
  entities: [CoreEntity, InstanceEntity],
  migrations: [],
  subscribers: [],
});

export const getDataSource = (delay = 3000): Promise<DataSource> => {
  if (AppDataSource.isInitialized) return Promise.resolve(AppDataSource);

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (AppDataSource.isInitialized) resolve(AppDataSource);
      else reject("Failed to create connection with database");
    }, delay);
  });
};

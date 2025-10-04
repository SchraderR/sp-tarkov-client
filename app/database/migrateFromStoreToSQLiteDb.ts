import * as Store from 'electron-store';
import { UserSettingStoreModel } from '../../shared/models/user-setting.model';
import { getDataSource } from './data-source';
import { CoreEntity } from './entity/Core';

export async function migrateFromStoreToSQLiteDb(store: Store<UserSettingStoreModel>) {
  const dbSource = await getDataSource();
  const isMigrated = store.get('migrated');
  if (isMigrated) {
    return;
  }

  const storeIsTutorialDone = store.get('isTutorialDone');

  var ttt = await dbSource.manager.count(CoreEntity);
  console.log ( "ttt", ttt );
  console.log('Inserting a new user into the database...');
  // const user = new User()
  // user.firstName = "Timber"
  // user.lastName = "Saw"
  // user.age = 25
  // await AppDataSource.manager.save(user)
  // console.log("Saved a new user with id: " + user.id)
  //
  // console.log("Loading users from the database...")
  // const users = await AppDataSource.manager.find(User)
  // console.log("Loaded users: ", users)
  //
  // console.log("Here you can setup and run express / fastify / any other framework.")
}

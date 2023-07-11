import { AkiCore } from './aki-core.model';

export interface UserSettingStoreModel {
  akiInstances: AkiInstance[];
}

export interface AkiInstance {
  akiRootDirectory: string;
}

export interface UserSettingModel extends AkiInstance {
  akiCore: AkiCore;
}

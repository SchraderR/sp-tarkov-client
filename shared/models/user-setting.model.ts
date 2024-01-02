import { AkiCore } from './aki-core.model';

export interface UserSettingStoreModel {
  akiInstances: AkiInstance[];
}

export interface AkiInstance {
  akiRootDirectory: string;
  isValid: boolean;
  isActive: boolean;
  clientMods?: ModMeta[];
  serverMods?: ModMeta[];
}

export interface UserSettingModel extends AkiInstance {
  akiCore: AkiCore;
}

export interface ModMeta {
  name: string;
  version: string;
}

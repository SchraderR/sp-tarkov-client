import { AkiCore } from './aki-core.model';

export interface UserSettingStoreModel {
  akiInstances: AkiInstance[];
}

export interface AkiInstance {
  akiRootDirectory: string;
  isValid: boolean;
  isActive: boolean;
}

export interface UserSettingModel extends AkiInstance {
  akiCore: AkiCore;
}

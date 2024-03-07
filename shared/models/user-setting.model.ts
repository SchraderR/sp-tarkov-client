import { AkiCore } from './aki-core.model';

export interface UserSettingStoreModel {
  akiInstances: AkiInstance[];
  theme: Theme;
  isTutorialDone: boolean;
  isExperimentalFunctionsActive: boolean;
}

export interface AkiInstance {
  akiRootDirectory: string;
  isValid: boolean;
  isActive: boolean;
  isLoading: boolean;
  clientMods: ModMeta[];
  serverMods: ModMeta[];
}

export interface UserSettingModel extends AkiInstance {
  akiCore: AkiCore;
}

export interface ModMeta {
  name: string;
  version: string;
  alternativeName?: string;
}

export enum Theme {
  dark = 'dark',
  light = 'light',
  system = 'system',
}

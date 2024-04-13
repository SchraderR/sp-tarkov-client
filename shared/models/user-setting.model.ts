import { AkiCore } from './aki-core.model';

export interface UpdateModMeta {
  name: string;
  hubName: string;
  version: string;
  hubId: string;
  url: string;
  imageIcon: string;
  clientName: string;
  serverName: string;
}

export interface UserSettingStoreModel {
  modMetaData: UpdateModMeta[];
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
  isError: boolean;
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
  modPath: string;
}

export enum Theme {
  dark = 'dark',
  light = 'light',
  system = 'system',
}

import { AkiCore, AkiTag, AkiVersion } from './aki-core.model';

export interface UpdateModMeta {
  name: string;
  version: string;
  hubId: string;
  imageIcon: string;
  clientName: string;
  serverName: string;
}

export interface ModCache {
  name: string;
  fileUrl: string;
  supportedAkiVersion: string;
  image?: string;
  icon?: string;
  teaser?: string;
  akiVersionColorCode?: string;
}

export interface UserSettingStoreModel {
  modMetaData: UpdateModMeta[];
  akiInstances: AkiInstance[];
  theme: Theme;
  isTutorialDone: boolean;
  isExperimentalFunctionsActive: boolean;
  akiVersions: AkiVersion[];
  akiTags: AkiTag[];
  modCache: ModCache[];
  useIndexedMods: boolean;
}

export interface AkiInstance {
  akiRootDirectory: string;
  isValid: boolean;
  isActive: boolean;
  isLoading: boolean;
  isError: boolean;
  isPowerShellIssue: boolean;
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
  isDirectory?: boolean;
  subMods?: ModMeta[];
}

export enum Theme {
  dark = 'dark',
  light = 'light',
  system = 'system',
}

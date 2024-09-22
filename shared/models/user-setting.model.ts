import { SptCore, SptTag, SptVersion } from './spt-core.model';
import { TrackedFile } from '../../app/events/file-tracking.event';

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
  supportedSptVersion: string;
  image?: string;
  icon?: string;
  teaser?: string;
  sptVersionColorCode?: string;
}

export interface UserSettingStoreModel {
  modMetaData: UpdateModMeta[];
  sptInstances: SptInstance[];
  theme: Theme;
  isTutorialDone: boolean;
  isExperimentalFunctionsActive: boolean;
  isCheckInstalledActive: boolean;
  sptVersions: SptVersion[];
  sptTags: SptTag[];
  modCache: ModCache[];
  useIndexedMods: boolean;
  keepTempDownloadDirectory: boolean;
  akiInstances: SptInstance[]; // obsolete
  akiVersions: SptVersion[]; // obsolete
  akiTags: SptTag[]; // obsolete
}

export interface SptInstance {
  sptRootDirectory: string;
  akiRootDirectory?: string; // obsolete
  isValid: boolean;
  isActive: boolean;
  isLoading: boolean;
  isError: boolean;
  isPowerShellIssue: boolean;
  trackedFileData: TrackedFile[];
  clientMods: ModMeta[];
  serverMods: ModMeta[];
}

export interface UserSettingModel extends SptInstance {
  sptCore?: SptCore;
}

export interface ModMeta {
  name: string;
  version: string;
  alternativeName?: string;
  modPath: string;
  modOriginalPath: string;
  modOriginalName: string;
  isDirectory?: boolean;
  subMods?: ModMeta[];
  isEnabled: boolean;
  isPrePatcherMod?: boolean;
}

export enum Theme {
  dark = 'dark',
  light = 'light',
  system = 'system',
}

import { SptCore, SptTag, SptVersion } from './spt-core.model';
import { TrackedMod } from './tracked-mod.model';

export interface UpdateModMeta {
  name: string;
  version: string;
  hubId: string;
  imageIcon: string;
  clientName: string;
  serverName: string;
}

export interface ModCache {
  modId: number;
  name: string;
  thumbnail: string;
  teaser: string;
}

export interface UserSettingStoreModel {
  modMetaData: UpdateModMeta[];
  sptInstances: SptInstance[];
  theme: Theme;
  isTutorialDone: boolean;
  isExperimentalFunctionsActive: boolean;
  sptVersions: SptVersion[];
  sptTags: SptTag[];
  modCache: ModCache[];
  useIndexedMods: boolean;
  keepTempDownloadDirectory: boolean;
}

export interface SptInstance {
  sptRootDirectory: string;
  isValid: boolean;
  isActive: boolean;
  isLoading: boolean;
  isError: boolean;
  trackedMods: TrackedMod[];
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

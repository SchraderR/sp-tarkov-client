import { DownloadProgress } from '../../../../shared/models/download.model';
import { ForgeMod } from '../services/forge-api.service';

// TODO REFACTORING
// export interface UPDATED_MOD_REFACTOR_LATER extends ForgeMod, Mod {}

export interface Mod extends ForgeMod {
  //   name: string;
  //   hubId?: string;
  //   modVersion?: string;
  //   fileUrl: string;
  //   kind: string;
  notSupported: boolean;
  //   supportedSptVersion: string;
  //   image?: string;
  //   icon?: string;
  isDependenciesLoading: boolean;
  //   dependencies: Mod[];
  //   lastUpdate?: string;
  //   isInvalid: boolean;
  //   isAlreadyInModList?: boolean;
  installProgress?: InstallProgress;
  //   sptVersionColorCode?: string;
}

export interface InstallProgress {
  completed: boolean;
  started?: Date;
  finished?: Date;
  error?: boolean;
  downloadStep: DownloadProgress;
  unzipStep: StepProgress;
}

export interface StepProgress {
  error: boolean;
  start: boolean;
  progress: number;
}

import { DownloadProgress } from '../../../../shared/models/download.model';

export interface Mod {
  name: string;
  modVersion?: string;
  fileUrl: string;
  kind: string;
  notSupported: boolean;
  supportedSptVersion: string;
  image?: string;
  icon?: string;
  teaser?: string;
  lastUpdate?: string;
  isAlreadyInModList?: boolean;
  installProgress?: InstallProgress;
  sptVersionColorCode?: string;
}

export interface InstallProgress {
  completed: boolean;
  started?: Date;
  finished?: Date;
  error?: boolean;
  linkStep: StepProgress;
  downloadStep: DownloadProgress;
  unzipStep: StepProgress;
}

export interface StepProgress {
  error: boolean;
  start: boolean;
  progress: number;
}

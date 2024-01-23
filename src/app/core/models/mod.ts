import { DownloadProgress } from '../../../../shared/models/download.model';
import { Kind } from '../../../../shared/models/unzip.model';

export interface Mod {
  name: string;
  image?: string;
  icon?: string;
  fileUrl: string;
  kind: Kind | undefined;
  teaser?: string;
  isAlreadyInModList?: boolean;
  installProgress?: InstallProgress;
  supportedAkiVersion?: string;
  akiVersionColorCode?: string;
}

export interface InstallProgress {
  completed: boolean;
  started?: Date;
  finished?: Date;

  linkStep: StepProgress;
  downloadStep: DownloadProgress;
  unzipStep: StepProgress;
}

export interface StepProgress {
  error: boolean;
  start: boolean;
  progress: number;
}

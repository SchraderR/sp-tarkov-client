export interface AkiCore {
  akiVersion: string;
  projectName: string;
  compatibleTarkovVersion: string;
  serverName: string;
  profileSaveIntervalSeconds: number;
  commit: string;
}

export interface DownloadModel {
  url: string;
  akiInstancePath: string;
}

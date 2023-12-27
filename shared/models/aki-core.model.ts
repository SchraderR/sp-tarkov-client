export interface AkiCore {
  akiVersion: string;
  projectName: string;
  compatibleTarkovVersion: string;
  serverName: string;
  profileSaveIntervalSeconds: number;
  commit: string;
}

export interface DownloadModel {
  fileId: string;
  modFileUrl: string;
  akiInstancePath: string;
}

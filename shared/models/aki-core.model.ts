export interface AkiCore {
  akiVersion: string;
  projectName: string;
  compatibleTarkovVersion: string;
  serverName: string;
  profileSaveIntervalSeconds: number;
  commit: string;
}

export interface DownloadModel {
  name?: string;
  fileId: string;
  modFileUrl: string;
  akiInstancePath: string;
}

export interface LinkModel {
  fileId: string;
  akiInstancePath: string;
  downloadUrl: string;
}

export interface AkiVersion {
  dataLabelId: string;
  innerText: string;
}

export interface AkiTag {
  tagPath: string;
  innerText: string;
}

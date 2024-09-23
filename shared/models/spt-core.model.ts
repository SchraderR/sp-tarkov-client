export interface SptCore {
  akiVersion?: string; //obsolete
  sptVersion: string;
  projectName: string;
  compatibleTarkovVersion: string;
  serverName: string;
  profileSaveIntervalSeconds: number;
  commit: string;
}

export interface DownloadModel {
  name?: string;
  hubId: string;
  modFileUrl: string;
  sptInstancePath: string;
}

export interface LinkModel {
  fileId: string;
  sptInstancePath: string;
  downloadUrl: string;
}

export interface SptVersion {
  dataLabelId: string;
  innerText: string;
}

export interface SptTag {
  tagPath: string;
  innerText: string;
}

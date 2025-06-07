export interface SptCore {
  sptVersion: string;
  projectName: string;
  compatibleTarkovVersion: string;
  serverName: string;
  profileSaveIntervalSeconds: number;
  commit: string;
}

export interface DownloadModel {
  modId: number;
  modFileUrl: string;
  sptInstancePath: string;
}

export interface LinkModel {
  modId: number;
  downloadUrl: string;
  sptInstancePath: string;
}

export interface SptVersion {
  id: number; // 2,
  version: string; // "3.11.3",
  version_major: number; // 3,
  version_minor: number; // 11,
  version_patch: number; // 3,
  version_labels: string; // "",
  mod_count: string; // 371,
  link: string; // "https://github.com/sp-tarkov/build/releases/tag/3.11.3",
  color_class: string; //" green",
  created_at: string; // "2025-04-08T19:29:40.000000Z",
  updated_at: string; // "2025-04-08T19:29:40.000000Z"
}

export interface SptTag {
  tagPath: string;
  innerText: string;
}

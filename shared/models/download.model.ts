export interface DownloadBase {
  percent: number;
  totalBytes: string;
}

export interface DownloadProgress extends DownloadBase {
  transferredBytes: string;
  start: boolean;
  error: boolean;
  pending?: boolean;
}

export interface DirectDownload extends DownloadBase {
  savePath: string;
}

export interface GithubRateLimit {
  remaining: number;
  reset: number;
  limit: number;
  used: number;
}

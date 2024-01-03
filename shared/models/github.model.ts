export interface GithubRelease {
  assets:           Asset[];
}

export interface Asset {
  url:                  string;
  id:                   number;
  label:                null;
  size:                 number;
  created_at:           Date;
  updated_at:           Date;
  browser_download_url: string;
}

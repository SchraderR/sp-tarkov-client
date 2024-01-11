export type applicationElectronEventNames =
  | 'open-directory'
  | 'user-settings'
  | 'user-settings-update'
  | 'user-settings-remove'
  | 'download-link'
  | 'download-mod'
  | 'file-unzip'
  | 'client-mod'
  | 'server-mod'
  | 'window-minimize'
  | 'window-maximize'
  | 'window-close';

export type applicationElectronFileProgressEventNames = 'download-mod-progress' | 'download-mod-direct' | 'download-mod-direct-completed';

export enum ApplicationElectronFileError {
  downloadLinkError,
  downloadError,
  unzipError,
}

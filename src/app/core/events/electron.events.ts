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
  | 'window-close'
  | 'clear-temp'
  | 'theme-setting'
  | 'theme-toggle'
  | 'tutorial-setting'
  | 'tutorial-toggle'
  | 'tarkov-start'
  | 'mod-load-order'
  | 'mod-load-order-save'
  | 'exp-function-setting'
  | 'exp-function-toggle'
  | 'update-mod-data'
  | 'spt-versions'
  | 'spt-versions-save'
  | 'spt-tags'
  | 'spt-tags-save'
  | 'mod-list-cache'
  | 'add-mod-list-cache'
  | 'remove-mod-list-cache'
  | 'use-indexed-mods'
  | 'use-indexed-mods-save'
  | 'toggle-mod-state'
  | 'get-mod-page'
  | 'keep-temp-dir-setting'
  | 'keep-temp-dir-setting-toggle'
  | 'temp-dir-size'
  | 'save-mod-load-order'
  | 'check-installed-toggle'
  | 'check-installed-setting';

export type applicationElectronFileProgressEventNames = 'download-mod-progress' | 'download-mod-direct' | 'download-mod-direct-completed';
export type applicationTarkovInstanceOutputEventNames = 'server-output' | 'server-output-completed';

export enum ApplicationElectronFileError {
  downloadLinkError,
  downloadError,
  unzipError,
}

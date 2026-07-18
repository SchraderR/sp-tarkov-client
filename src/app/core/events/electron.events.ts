export type applicationElectronEventNames =
  | 'open-directory'
  | 'user-setting'
  | 'user-instances'
  | 'user-instance-active'
  | 'user-instance-remove'
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
  | 'server-start'
  | 'server-stop'
  | 'mod-load-order'
  | 'mod-load-order-save'
  | 'exp-function-setting'
  | 'exp-function-toggle'
  | 'update-mod-data'
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
  | 'check-installed-setting'
  | 'process-download-link'
  ;

export type applicationElectronFileProgressEventNames = 'download-mod-progress' | 'download-mod-direct' | 'download-mod-direct-completed';
export type applicationTarkovInstanceOutputEventNames = 'server-output' | 'server-output-completed' | 'server-exit';

export enum ApplicationElectronFileError {
  downloadError,
  unzipError,
}

﻿export type applicationElectronEventNames =
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
  | 'exp-function-setting'
  | 'exp-function-toggle';

export type applicationElectronFileProgressEventNames = 'download-mod-progress' | 'download-mod-direct' | 'download-mod-direct-completed';
export type applicationTarkovInstanceOutputEventNames = 'server-output' | 'server-output-completed';

export enum ApplicationElectronFileError {
  downloadLinkError,
  downloadError,
  unzipError,
}

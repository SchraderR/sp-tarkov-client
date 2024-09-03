export interface ToggleModStateModel {
  sptInstancePath: string;
  modOriginalPath: string;
  modOriginalName: string;
  isServerMod: boolean;
  isPrePatcherMod?: boolean;
  modWillBeDisabled: boolean;
}

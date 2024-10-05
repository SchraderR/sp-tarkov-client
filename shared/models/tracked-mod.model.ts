export interface TrackedMod {
  modName: string;
  hubId: string;
  modVersion?: string;
  nextUpdateCheck: string;
  newVersionDetected?: boolean;
  newModVersion?: string;
  isActive: boolean;
}

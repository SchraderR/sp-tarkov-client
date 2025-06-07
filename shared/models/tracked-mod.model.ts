export interface TrackedMod {
  hubId: number;
  modName: string;
  modVersion?: string;
  nextUpdateCheck: string;
  newVersionDetected?: boolean;
  newModVersion?: string;
  isActive: boolean;
}

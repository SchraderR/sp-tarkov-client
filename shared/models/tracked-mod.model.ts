export interface TrackedMod {
  modName: string;
  hubId: number;
  modVersion?: string;
  nextUpdateCheck: string;
  newVersionDetected?: boolean;
  newModVersion?: string;
  isActive: boolean;
}

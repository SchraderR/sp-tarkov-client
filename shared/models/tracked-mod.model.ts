export interface TrackedMod {
  modName: string;
  hubId: string;
  modVersion?: string;
  nextUpdateCheck: string;
  isActive: boolean;
}

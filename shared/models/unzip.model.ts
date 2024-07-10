export interface FileUnzipEvent {
  sptInstancePath: string;
  filePath: string;
  hubId: string;
  kind: Kind | undefined;
}

export enum Kind {
  client = 'client',
  server = 'server',
  overhaul = 'overhaul',
}

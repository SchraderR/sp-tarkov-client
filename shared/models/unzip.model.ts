export interface FileUnzipEvent {
  sptInstancePath: string;
  filePath: string;
  hubId: string;
  kind: string;
}

export enum Kind {
  client = 'client',
  server = 'server',
  overhaul = 'overhaul',
}

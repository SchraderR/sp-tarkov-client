export interface FileUnzipEvent {
  instancePath: string;
  filePath: string;
  hubId: string;
  name: string;
  version?: string;
  kind: string;
}

export enum Kind {
  client = 'client',
  server = 'server',
  overhaul = 'overhaul',
}

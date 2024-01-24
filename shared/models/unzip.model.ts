export interface FileUnzipEvent {
  akiInstancePath: string;
  filePath: string;
  kind: Kind | undefined;
}

export enum Kind {
  client = 'client' ,
  server = 'server' ,
  overhaul = 'overhaul' ,
}

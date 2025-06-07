export interface FileUnzipEvent {
  instancePath: string;
  filePath: string;
  hubId: number;
  name: string;
  version?: string;
}

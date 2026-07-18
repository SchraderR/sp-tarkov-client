import { app } from 'electron';
import * as path from 'path';

export function getTempDownloadDirectory(): string {
  return path.join(app.getPath('userData'), '_temp');
}

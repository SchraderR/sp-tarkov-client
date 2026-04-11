import { promisify } from 'util';
import { exec as execCallback } from 'child_process';
import * as log from 'electron-log';

const exec = promisify(execCallback);

export async function getVersion(dllFilePath: string): Promise<string | null> {
  try {
    const { stdout } = await exec(`powershell "[System.Diagnostics.FileVersionInfo]::GetVersionInfo('${dllFilePath}').FileVersion"`);

    return stdout.trim() || null;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log.error(`Failed to read version for "${dllFilePath}": ${message}`);
    throw new Error(`PowerShell version lookup failed for "${dllFilePath}": ${message}`);
  }
}

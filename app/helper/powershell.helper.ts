import { promisify } from 'util';
import { exec as execCallback, execFile as execFileCallback } from 'child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import * as path from 'path';
import * as log from 'electron-log';

const exec = promisify(execCallback);
const execFile = promisify(execFileCallback);

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

export async function getVersions(dllFilePaths: string[]): Promise<Map<string, string | null>> {
  const versions = new Map<string, string | null>();
  if (dllFilePaths.length === 0) {
    return versions;
  }

  // Pass the paths through a temp file so neither the command-line length limit nor quoting/escaping of the paths can break the lookup.
  const tempDir = mkdtempSync(path.join(tmpdir(), 'spt-versions-'));
  const listFilePath = path.join(tempDir, 'paths.txt');
  writeFileSync(listFilePath, dllFilePaths.join('\n'), 'utf8');

  try {
    // Emit one `v=<version>` line per input path, in order, so the results can b mapped back by index. The `v=` prefix keeps empty versions on their own line.
    const script =
      `$ErrorActionPreference = 'SilentlyContinue';` +
      `Get-Content -LiteralPath '${listFilePath.replace(/'/g, "''")}' -Encoding UTF8 | ForEach-Object {` +
      `  $v = '';` +
      `  try { $v = [System.Diagnostics.FileVersionInfo]::GetVersionInfo($_).FileVersion } catch {}` +
      `  'v=' + $v` +
      `}`;

    const { stdout } = await execFile('powershell', ['-NoProfile', '-NonInteractive', '-Command', script], {
      maxBuffer: 20 * 1024 * 1024,
    });

    const lines = stdout.split(/\r?\n/).filter(line => line.startsWith('v='));
    dllFilePaths.forEach((filePath, index) => {
      const value = (lines[index] ?? 'v=').slice(2).trim();
      versions.set(filePath, value || null);
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    log.error(`Batch version lookup failed for ${dllFilePaths.length} file(s): ${message}`);
    dllFilePaths.forEach(filePath => versions.set(filePath, null));
  } finally {
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // tryed my best
    }
  }

  return versions;
}

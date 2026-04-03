export async function getVersion(dllFilePath: string) {
  try {
    const exec = require('util').promisify(require('child_process').exec);
    const { stderr, stdout } = await exec(`powershell "[System.Diagnostics.FileVersionInfo]::GetVersionInfo('${dllFilePath}').FileVersion`);

    if (stderr) {
      return stderr;
    }

    return stdout;
  } catch (error) {
    throw { error, isPowerShellIssue: true };
  }
}

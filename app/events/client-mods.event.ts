import { app, ipcMain } from 'electron';
import * as path from 'path';
import { clientPatcherModPath, clientPluginModPath } from '../constants';
import * as fs from 'fs';
import * as log from 'electron-log';
import { ensureDirSync } from 'fs-extra';
import { Dirent, readdirSync } from 'node:fs';
import { getVersions } from '../helper/powershell.helper';

export const handleClientModsEvent = () => {
  ipcMain.on('client-mod', async (event, sptInstancePath: string) => {
    try {
      if (fs.existsSync(sptInstancePath)) {
        let data = [];
        const rootClientPluginPath = path.join(sptInstancePath, clientPluginModPath);
        const rootClientPatchersPath = path.join(sptInstancePath, clientPatcherModPath);

        const patcherDllFiles = fs
          .readdirSync(rootClientPatchersPath, { withFileTypes: true })
          .filter(
            file =>
              file.isFile() &&
              (file.name.toLowerCase().includes('.prepatch.') ||
                file.name.toLowerCase().includes('_prepatch.') ||
                file.name.toLowerCase().includes('prepatch')) &&
              path.extname(file.name) === '.dll'
          );

        const rootDllFiles = fs
          .readdirSync(rootClientPluginPath, { withFileTypes: true })
          .filter(file => file.isFile() && path.extname(file.name) === '.dll');

        const directoryEntries = fs
          .readdirSync(rootClientPluginPath, { withFileTypes: true })
          .filter(dirent => dirent.isDirectory() && dirent.name !== 'spt')
          .map(dirent => ({
            dir: dirent.name,
            dllFiles: fs
              .readdirSync(path.join(rootClientPluginPath, dirent.name), { withFileTypes: true })
              .filter(file => file.isFile() && path.extname(file.name) === '.dll'),
          }))
          .filter(entry => entry.dllFiles.length > 0);

        const allDllPaths = [
          ...patcherDllFiles.map(file => path.join(rootClientPatchersPath, file.name)),
          ...rootDllFiles.map(file => path.join(rootClientPluginPath, file.name)),
          ...directoryEntries.flatMap(entry => entry.dllFiles.map(file => path.join(rootClientPluginPath, entry.dir, file.name))),
        ];
        const versions = await getVersions(allDllPaths);

        for (const file of patcherDllFiles) {
          data.push({
            name: file.name.split('.dll')[0],
            version: versions.get(path.join(rootClientPatchersPath, file.name)) ?? null,
            isPrePatcherMod: true,
            modPath: rootClientPatchersPath,
            modOriginalPath: path.join(file.parentPath, file.name),
            modOriginalName: file.name,
            isEnabled: true,
          });
        }

        for (const file of rootDllFiles) {
          data.push({
            name: file.name.split('.dll')[0],
            version: versions.get(path.join(rootClientPluginPath, file.name)) ?? null,
            isPrePatcherMod: false,
            modPath: rootClientPluginPath,
            modOriginalPath: path.join(file.parentPath, file.name),
            modOriginalName: file.name,
            isEnabled: true,
          });
        }

        for (const { dir, dllFiles } of directoryEntries) {
          const firstDll = dllFiles[0];

          data.push({
            isDirectory: true,
            name: dir,
            version: versions.get(path.join(rootClientPluginPath, dir, firstDll.name)) ?? null,
            isEnabled: true,
            isPrePatcherMod: false,
            modOriginalPath: firstDll.parentPath,
            modOriginalName: dir,
            modPath: firstDll.parentPath,
            subMods: dllFiles.map(m => ({
              version: versions.get(path.join(rootClientPluginPath, dir, m.name)) ?? null,
              modPath: firstDll.parentPath,
              name: m.name.split('.dll')[0],
            })),
          });
        }

        data = await checkForDisabledClientMods(data, sptInstancePath);

        event.sender.send('client-mod-completed', data);
      }
    } catch (error: any) {
      event.sender.send('client-mod-error', { error, isPowerShellIssue: error.isPowerShellIssue });
      log.error(error);
    }
  });
};

async function checkForDisabledClientMods(data: any[], sptInstancePath: string): Promise<any[]> {
  try {
    const appPath = app.getPath('userData');
    const instanceName = sptInstancePath.split('\\').pop();
    if (!instanceName) {
      return data;
    }

    const instanceClientDisabledModPath = path.join(appPath, 'instances', instanceName, 'disabled', 'client');
    const instancePrePatcherDisabledModPath = path.join(appPath, 'instances', instanceName, 'disabled', 'prepatcher');

    ensureDirSync(instanceClientDisabledModPath);
    ensureDirSync(instancePrePatcherDisabledModPath);

    const disabledClientMods = readdirSync(instanceClientDisabledModPath, { withFileTypes: true });
    const disabledPrePatcherMods = readdirSync(instancePrePatcherDisabledModPath, { withFileTypes: true });

    // Pre-read the sub-mods of every disabled directory so all version lookups can be batched.
    const clientDirSubMods = new Map<string, Dirent[]>();
    for (const mod of disabledClientMods) {
      if (mod.isDirectory()) {
        const subMods = readdirSync(path.join(instanceClientDisabledModPath, mod.name), { withFileTypes: true }).filter(
          file => file.isFile() && path.extname(file.name) === '.dll'
        );
        clientDirSubMods.set(mod.name, subMods);
      }
    }

    const prePatcherDirSubMods = new Map<string, Dirent[]>();
    for (const mod of disabledPrePatcherMods) {
      if (mod.isDirectory()) {
        const subMods = readdirSync(path.join(instancePrePatcherDisabledModPath, mod.name), { withFileTypes: true }).filter(
          file =>
            file.isFile() &&
            (file.name.toLowerCase().includes('.prepatch.') || file.name.toLowerCase().includes('_prepatch.')) &&
            path.extname(file.name) === '.dll'
        );
        prePatcherDirSubMods.set(mod.name, subMods);
      }
    }

    // Collect every disabled DLL path and read all versions in a single PowerShell process.
    const allDisabledDllPaths = [
      ...disabledClientMods.filter(mod => mod.isFile()).map(mod => path.join(instanceClientDisabledModPath, mod.name)),
      ...[...clientDirSubMods.entries()].flatMap(([name, subMods]) =>
        subMods.map(subMod => path.join(instanceClientDisabledModPath, name, subMod.name))
      ),
      ...disabledPrePatcherMods.filter(mod => mod.isFile()).map(mod => path.join(instancePrePatcherDisabledModPath, mod.name)),
      ...[...prePatcherDirSubMods.entries()].flatMap(([name, subMods]) =>
        subMods.map(subMod => path.join(instancePrePatcherDisabledModPath, name, subMod.name))
      ),
    ];
    const versions = await getVersions(allDisabledDllPaths);

    for (const mod of disabledClientMods) {
      const filePath = path.join(instanceClientDisabledModPath, mod.name);

      if (mod.isFile()) {
        data.push({
          name: mod.name.split('.dll')[0],
          version: versions.get(filePath) ?? null,
          modPath: instanceClientDisabledModPath,
          modOriginalPath: filePath,
          modOriginalName: mod.name,
          isEnabled: false,
        });
      } else if (mod.isDirectory()) {
        const subMods = clientDirSubMods.get(mod.name) ?? [];

        data.push({
          name: mod.name,
          modPath: filePath,
          modOriginalPath: filePath,
          modOriginalName: mod.name,
          isEnabled: false,
          isDirectory: true,
          subMods: subMods.map(m => ({
            version: versions.get(path.join(filePath, m.name)) ?? null,
            modPath: filePath,
            name: m.name.split('.dll')[0],
          })),
        });
      }
    }

    for (const mod of disabledPrePatcherMods) {
      const filePath = path.join(instancePrePatcherDisabledModPath, mod.name);

      if (mod.isFile()) {
        data.push({
          name: mod.name.split('.dll')[0],
          version: versions.get(filePath) ?? null,
          modPath: instancePrePatcherDisabledModPath,
          modOriginalPath: filePath,
          modOriginalName: mod.name,
          isEnabled: false,
        });
      } else if (mod.isDirectory()) {
        const subMods = prePatcherDirSubMods.get(mod.name) ?? [];

        data.push({
          name: mod.name,
          modPath: filePath,
          modOriginalPath: filePath,
          modOriginalName: mod.name,
          isEnabled: false,
          isDirectory: true,
          isPrePatcherMod: true,
          subMods: subMods.map(m => ({
            version: versions.get(path.join(filePath, m.name)) ?? null,
            modPath: filePath,
            name: m.name.split('.dll')[0],
          })),
        });
      }
    }

    return data;
  } catch (e) {
    console.error(e);
    return data;
  }
}

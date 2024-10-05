import { UserSettingStoreModel } from '../../shared/models/user-setting.model';
import { error, log } from 'electron-log';
import { addMinutes } from 'date-fns';
import { FileUnzipEvent } from '../../shared/models/unzip.model';
import * as Store from 'electron-store';
import { readdirSync, statSync, symlinkSync } from 'node:fs';
import * as path from 'path';
import { clientPluginModPath, serverModPath } from '../constants';
import { existsSync } from 'fs-extra';
import { TrackedMod } from '../../shared/models/tracked-mod.model';

export class ModTrackingHelper {
  private _store: Store<UserSettingStoreModel>;

  constructor(store: Store<UserSettingStoreModel>) {
    this._store = store;
  }

  trackMod(args: FileUnzipEvent, sourcePath: string) {
    const instances = this._store.get('sptInstances');
    const instance = instances.find(i => i.sptRootDirectory === args.instancePath);

    if (!instance) {
      error('Instance not found to track files');
      return;
    }

    const fileTrackingData: TrackedMod[] = instance.trackedMods || [];
    const modAlreadyExist = fileTrackingData.find(d => d.hubId === args.hubId);
    if (modAlreadyExist) {
      error('Mod already exists');
      return;
    }

    fileTrackingData.push({
      modName: args.name,
      hubId: args.hubId,
      modVersion: args.version,
      nextUpdateCheck: addMinutes(new Date(), 30).toISOString(),
      isActive: true,
    });

    this.createModLinks(sourcePath, args);

    instance.trackedMods = fileTrackingData;
    this._store.set('sptInstances', instances);
  }

  createModLinks(sourcePath: string, trackedFileData: FileUnzipEvent) {
    const pathsToCheck = [clientPluginModPath, serverModPath];

    pathsToCheck.forEach(modPath => {
      const fullSourcePath = path.join(sourcePath, modPath);
      if (!existsSync(fullSourcePath)) {
        return;
      }

      if (statSync(fullSourcePath).isDirectory()) {
        const modDirectory = readdirSync(fullSourcePath);

        modDirectory.forEach(modName => {
          const sourceModPath = path.join(fullSourcePath, modName);
          const targetModPath = path.join(trackedFileData.instancePath, modPath, modName);

          symlinkSync(sourceModPath, targetModPath);
          log(`HubId:${trackedFileData.hubId} - Initial SymLink created ${sourceModPath} -> ${targetModPath}`);
        });
      }
    });
  }
}

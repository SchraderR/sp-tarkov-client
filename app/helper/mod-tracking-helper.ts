import { UserSettingStoreModel } from '../../shared/models/user-setting.model';
import { error } from 'electron-log';
import { TrackedMods } from '../events/file-tracking.event';
import { addHours } from 'date-fns';
import { FileUnzipEvent } from '../../shared/models/unzip.model';
import * as Store from 'electron-store';
import { readdirSync, readlinkSync, statSync, symlinkSync } from 'node:fs';
import * as path from 'path';
import { clientPatcherModPath, clientPluginModPath, serverModPath } from '../constants';

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

    const fileTrackingData: TrackedMods[] = instance.trackedMods || [];
    const modAlreadyExist = fileTrackingData.find(d => d.hubId === args.hubId);
    if (modAlreadyExist) {
      error('Mod already exists');
      return;
    }

    fileTrackingData.push({
      modName: args.name,
      hubId: args.hubId,
      modVersion: args.version,
      nextUpdateCheck: addHours(new Date(), 1).toISOString(),
      isActive: true,
    });

    this.createModLinks(sourcePath, args.instancePath);

    instance.trackedMods = fileTrackingData;
    this._store.set('sptInstances', instances);
  }

  private createModLinks(sourcePath: string, instancePath: string) {
    const pathsToCheck = [clientPluginModPath, serverModPath];

    pathsToCheck.forEach(modPath => {
      const fullSourcePath = path.join(sourcePath, modPath);

      if (statSync(fullSourcePath).isDirectory()) {
        const modDirectory = readdirSync(fullSourcePath);
        console.log('modDirectory', modDirectory);

        modDirectory.forEach(modName => {
          const sourceModPath = path.join(fullSourcePath, modName);
          const targetModPath = path.join(instancePath, modPath, modName);
          console.log('sourceModPath', sourceModPath);
          console.log('targetModPath', targetModPath);

          symlinkSync(sourceModPath, targetModPath);
        });
      }
    });
  }
}

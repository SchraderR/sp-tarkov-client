import * as Store from 'electron-store';
import { UserSettingStoreModel } from '../../shared/models/user-setting.model';
import { error } from 'electron-log';
import { TrackedFile } from '../events/file-tracking.event';
import { addHours } from 'date-fns';

export class FileTrackerHelper {
  trackFilesWithHubId(files: string[], hubId: string, instancePath: string, store: Store<UserSettingStoreModel>) {
    const instances = store.get('sptInstances');
    const instance = instances.find(i => i.sptRootDirectory === instancePath);

    if (!instance) {
      error('Instance not found to track files');
      return;
    }

    const fileTrackingData: TrackedFile[] = instance.trackedFileData || [];
    const modAlreadyExist = fileTrackingData.find(d => d.hubId === hubId);
    if (modAlreadyExist) {
      error('Mod already exists');
      return;
    }

    fileTrackingData.push({ hubId, files, lastUpdateCheck: addHours(new Date(), 1).toISOString(), isActive: true });
    instance.trackedFileData = fileTrackingData;
    instance.trackedFileData.forEach(f => console.log(f.files));

    store.set('sptInstances', instances);
  }
}

import { ChangeDetectorRef, inject, Injectable, NgZone } from '@angular/core';
import { FileHelper } from '../helper/file-helper';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { DownloadModel } from '../../../../shared/models/aki-core.model';
import { ApplicationElectronFileError } from '../events/electron.events';
import { ElectronService } from './electron.service';
import { UserSettingsService } from './user-settings.service';
import { DownloadProgress } from '../models/mod';
import { ModListService } from './mod-list.service';

@Injectable({
  providedIn: 'root',
})
export class DownloadService {
  #electronService = inject(ElectronService);
  #userSettingsService = inject(UserSettingsService);
  #modListService = inject(ModListService);

  activeModList = this.#modListService.modListSignal;
  isDownloadAndInstallInProgress = new BehaviorSubject(false);
  downloadProgressEvent = new BehaviorSubject<void>(void 0);

  async downloadAndInstall(): Promise<void> {
    this.isDownloadAndInstallInProgress.next(true);
    const activeInstance = this.#userSettingsService.userSettingSignal().find(us => us.isActive);
    if (!activeInstance) {
      return;
    }

    for (let i = 0; i < this.activeModList().length; i++) {
      const mod = this.activeModList()[i];
      if (mod.installProgress?.completed) {
        continue;
      }

      const fileId = FileHelper.extractFileIdFromUrl(mod.fileUrl);
      if (!fileId || !mod.installProgress) {
        continue;
      }

      try {
        this.#electronService.getDownloadModProgressForFileId().subscribe((progress: DownloadProgress) => {
          mod.installProgress!.downloadStep.percent = progress.percent;
          mod.installProgress!.downloadStep.totalBytes = FileHelper.fileSize(+progress.totalBytes);
          mod.installProgress!.downloadStep.transferredBytes = FileHelper.fileSize(+progress.transferredBytes);
          this.downloadProgressEvent.next();
        });

        mod.installProgress.linkStep.start = true;
        const downloadLinkEvent = await firstValueFrom(this.#electronService.sendEvent<string>('download-link', fileId));
        mod.installProgress.linkStep.progress = 1;

        mod.installProgress.linkStep.progress = 1;
        const downloadModel: DownloadModel = {
          fileId,
          akiInstancePath: activeInstance.akiRootDirectory,
          modFileUrl: downloadLinkEvent!.args,
        };

        const downloadFileEvent = await firstValueFrom(this.#electronService.sendEvent<string>('download-mod', downloadModel));
        const test = {
          file: downloadFileEvent?.args,
          akiInstancePath: activeInstance.akiRootDirectory,
        };
        mod.installProgress.unzipStep.start = true;
        await firstValueFrom(this.#electronService.sendEvent<any>('file-unzip', test));
        mod.installProgress.unzipStep.progress = 1;
        mod.installProgress.completed = true;

        this.#modListService.updateMod();
      } catch (error) {
        switch (error) {
          case ApplicationElectronFileError.unzipError:
            mod.installProgress.unzipStep.error = true;
            mod.installProgress.unzipStep.progress = 1;
            break;
          case ApplicationElectronFileError.downloadError:
          case ApplicationElectronFileError.downloadLinkError:
            break;
        }
      }
    }

    this.isDownloadAndInstallInProgress.next(false);
  }
}

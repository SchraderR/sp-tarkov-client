import { inject, Injectable } from '@angular/core';
import { FileHelper } from '../helper/file-helper';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { DownloadModel, LinkModel } from '../../../../shared/models/aki-core.model';
import { ApplicationElectronFileError } from '../events/electron.events';
import { ElectronService } from './electron.service';
import { UserSettingsService } from './user-settings.service';
import { ModListService } from './mod-list.service';
import { DownloadProgress } from '../../../../shared/models/download.model';
import { FileUnzipEvent } from '../../../../shared/models/unzip.model';

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
        mod.installProgress.linkStep.start = true;

        this.#electronService.getDownloadModProgressForFileId().subscribe((progress: DownloadProgress) => {
          mod.installProgress!.downloadStep.percent = progress.percent;
          mod.installProgress!.downloadStep.totalBytes = FileHelper.fileSize(+progress.totalBytes);
          mod.installProgress!.downloadStep.transferredBytes = FileHelper.fileSize(+progress.transferredBytes);
          this.downloadProgressEvent.next();
        });

        const linkModel: LinkModel = { fileId, akiInstancePath: activeInstance.akiRootDirectory };
        const downloadLinkEvent = await firstValueFrom(this.#electronService.sendEvent<string, LinkModel>('download-link', linkModel));
        mod.installProgress.linkStep.progress = 1;

        mod.installProgress.linkStep.progress = 1;
        const downloadModel: DownloadModel = {
          fileId,
          name: mod.name,
          akiInstancePath: activeInstance.akiRootDirectory,
          modFileUrl: downloadLinkEvent!.args,
        };

        const downloadFilePath = await firstValueFrom(this.#electronService.sendEvent<string, DownloadModel>('download-mod', downloadModel));
        const test: FileUnzipEvent = {
          filePath: downloadFilePath?.args,
          akiInstancePath: activeInstance.akiRootDirectory,
          kind: mod.kind,
        };
        mod.installProgress.unzipStep.start = true;
        await firstValueFrom(this.#electronService.sendEvent('file-unzip', test));
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
            mod.installProgress.downloadStep.error = true;
            mod.installProgress.downloadStep.percent = 100;
            break;
          case ApplicationElectronFileError.downloadLinkError:
            mod.installProgress.linkStep.error = true;
            mod.installProgress.linkStep.progress = 1;
            break;
        }
        continue;
      }
    }

    this.isDownloadAndInstallInProgress.next(false);
  }
}

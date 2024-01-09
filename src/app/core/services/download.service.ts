import { inject, Injectable } from '@angular/core';
import { FileHelper } from '../helper/file-helper';
import { BehaviorSubject, EMPTY, firstValueFrom, switchMap } from 'rxjs';
import { DownloadModel, LinkModel } from '../../../../shared/models/aki-core.model';
import { ApplicationElectronFileError } from '../events/electron.events';
import { ElectronService } from './electron.service';
import { UserSettingsService } from './user-settings.service';
import { ModListService } from './mod-list.service';
import { DirectDownload, DownloadProgress } from '../../../../shared/models/download.model';
import { FileUnzipEvent } from '../../../../shared/models/unzip.model';

@Injectable({
  providedIn: 'root',
})
export class DownloadService {
  private directDownloadFilePath = '';

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

        this.#electronService
          .getDownloadModProgressForFileId('download-mod-direct')
          .pipe(
            switchMap(() => {
              mod.installProgress!.linkStep.progress = 1;
              mod.installProgress!.downloadStep.pending = true;
              this.downloadProgressEvent.next();

              return this.#electronService.getDownloadModProgressForFileId<DirectDownload>('download-mod-direct-completed');
            }),
            switchMap(directDownload => {
              mod.installProgress!.unzipStep.start = true;
              mod.installProgress!.downloadStep.percent = 100;
              mod.installProgress!.downloadStep.totalBytes = FileHelper.fileSize(+directDownload.totalBytes);
              this.downloadProgressEvent.next();

              const unzipEvent: FileUnzipEvent = {
                filePath: directDownload.savePath,
                akiInstancePath: activeInstance.akiRootDirectory,
              };

              return this.#electronService.sendEvent<void, FileUnzipEvent>('file-unzip', unzipEvent);
            })
          )
          .subscribe(() => {
            mod.installProgress!.unzipStep.progress = 1;
            mod.installProgress!.completed = true;
            this.downloadProgressEvent.next();
            this.#modListService.updateMod();

            return;
          });

        const linkModel: LinkModel = { fileId, akiInstancePath: activeInstance.akiRootDirectory };
        const downloadLinkEvent = await firstValueFrom(this.#electronService.sendEvent<string>('download-link', linkModel));
        mod.installProgress.linkStep.progress = 1;
        console.log(downloadLinkEvent);

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

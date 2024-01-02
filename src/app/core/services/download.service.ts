import { ChangeDetectorRef, inject, Injectable, NgZone } from '@angular/core';
import { FileHelper } from '../helper/file-helper';
import { firstValueFrom } from 'rxjs';
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
  // #ngZone = inject(NgZone);
  // #changeDetectorRef = inject(ChangeDetectorRef);
  #modListService = inject(ModListService);

  activeModList = this.#modListService.modListSignal;

  constructor() {}

  async downloadAndInstall(): Promise<void> {
    // this.isDownloadAndInstallInProgress = true;
    const activeInstance = this.#userSettingsService.userSettingSignal().find(us => us.isActive);
    if (!activeInstance) {
      return;
    }
    console.log(this.activeModList());

    for (let i = 0; i < this.activeModList().length; i++) {
      const mod = this.activeModList()[i];
      console.log ( mod );
      const fileId = FileHelper.extractFileIdFromUrl(mod.fileUrl);
      if (!fileId) {
        continue;
      }

      try {
        this.#electronService.getDownloadModProgressForFileId().subscribe((progress: DownloadProgress) => {
          // this.#ngZone.run(() => {
          mod.installProgress.downloadStep.percent = progress.percent;
          mod.installProgress.downloadStep.totalBytes = FileHelper.fileSize(+progress.totalBytes);
          mod.installProgress.downloadStep.transferredBytes = FileHelper.fileSize(+progress.transferredBytes);
          //this.#changeDetectorRef.markForCheck();
          // });
        });

        mod.installProgress.linkStep.start = true;
        const downloadLinkEvent = await firstValueFrom(this.#electronService.sendEvent<string>('download-link', fileId));
        // this.#ngZone.run(() => {
        mod.installProgress.linkStep.progress = 1;
        //  this.#changeDetectorRef.markForCheck();
        // });

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
        // this.#ngZone.run(() => {
        mod.installProgress.unzipStep.progress = 1;
        // this.isDownloadAndInstallInProgress = false;
        //   this.#changeDetectorRef.markForCheck();
        // });
      } catch (error) {
        switch (error) {
          case ApplicationElectronFileError.unzipError:
            // this.#ngZone.run(() => {
            console.error(error);
            mod.installProgress.unzipStep.error = true;
            mod.installProgress.unzipStep.progress = 1;
            //   this.#changeDetectorRef.markForCheck();
            // });
            break;
          case ApplicationElectronFileError.downloadError:
          case ApplicationElectronFileError.downloadLinkError:
            break;
        }
      }
    }

    // this.isDownloadAndInstallInProgress = false;
  }
}

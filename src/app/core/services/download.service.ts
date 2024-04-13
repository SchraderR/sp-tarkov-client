import { inject, Injectable } from '@angular/core';
import { FileHelper } from '../helper/file-helper';
import { BehaviorSubject, switchMap } from 'rxjs';
import { DownloadModel, LinkModel } from '../../../../shared/models/aki-core.model';
import { ApplicationElectronFileError } from '../events/electron.events';
import { ElectronService } from './electron.service';
import { UserSettingsService } from './user-settings.service';
import { ModListService } from './mod-list.service';
import { DownloadProgress } from '../../../../shared/models/download.model';
import { FileUnzipEvent } from '../../../../shared/models/unzip.model';
import { Mod } from '../models/mod';
import { UserSettingModel } from '../../../../shared/models/user-setting.model';

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

  async downloadAndInstallAll(): Promise<void> {
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
        await this.installProcess(mod, fileId, activeInstance);
      } catch (error) {
        mod.installProgress.error = true;
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

    this.#electronService.sendEvent('clear-temp', activeInstance.akiRootDirectory).subscribe();
    this.isDownloadAndInstallInProgress.next(false);
  }

  async downloadAndInstallSingle(mod: Mod): Promise<void> {
    const isInProgress = this.isDownloadAndInstallInProgress.value;

    if (isInProgress) {
      const modIndex = this.#modListService.modListSignal().findIndex(modItem => modItem.name == mod.name);
      if (modIndex !== -1) {
        this.#modListService.modListSignal().splice(modIndex, 1);
        this.#modListService.modListSignal().push(mod);
      }
    } else {
      mod.installProgress = this.#modListService.initialInstallProgress();
      await this.downloadAndInstallAll();
    }
  }

  private async installProcess(mod: Mod, fileId: string, activeInstance: UserSettingModel) {
    if (!mod?.installProgress) {
      return;
    }
    if (mod?.installProgress?.error) {
      mod.installProgress = this.#modListService.initialInstallProgress();
    }

    mod.installProgress.linkStep.start = true;

    this.#electronService.getDownloadModProgressForFileId().subscribe((progress: DownloadProgress) => {
      if (mod.installProgress!.error) {
        return;
      }
      mod.installProgress!.downloadStep.percent = progress.percent;
      mod.installProgress!.downloadStep.totalBytes = FileHelper.fileSize(+progress.totalBytes);
      mod.installProgress!.downloadStep.transferredBytes = FileHelper.fileSize(+progress.transferredBytes);
      this.downloadProgressEvent.next();
    });

    const linkModel: LinkModel = { fileId, akiInstancePath: activeInstance.akiRootDirectory };

    await this.#electronService
      .sendEvent<string, LinkModel>('download-link', linkModel)
      .pipe(
        switchMap(downloadLinkEvent => {
          mod.installProgress!.linkStep.progress = 1;

          const downloadModel: DownloadModel = {
            fileId,
            name: mod.name,
            akiInstancePath: activeInstance.akiRootDirectory,
            modFileUrl: downloadLinkEvent!.args,
          };

          return this.#electronService.sendEvent<string, DownloadModel>('download-mod', downloadModel);
        }),
        switchMap(downloadFilePath => {
          const test: FileUnzipEvent = {
            fileId: fileId,
            filePath: downloadFilePath?.args,
            akiInstancePath: activeInstance.akiRootDirectory,
            kind: mod.kind,
          };

          mod.installProgress!.unzipStep.start = true;

          return this.#electronService.sendEvent('file-unzip', test);
        })
      )
      .toPromise();

    mod.installProgress!.unzipStep.progress = 1;
    mod.installProgress!.completed = true;
    this.#modListService.updateMod();
  }
}

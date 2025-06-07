import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { FileHelper } from '../helper/file-helper';
import { BehaviorSubject, firstValueFrom, switchMap } from 'rxjs';
import { DownloadModel, LinkModel } from '../../../../shared/models/spt-core.model';
import { ApplicationElectronFileError } from '../events/electron.events';
import { ElectronService } from './electron.service';
import { UserSettingsService } from './user-settings.service';
import { ModListService } from './mod-list.service';
import { DownloadProgress } from '../../../../shared/models/download.model';
import { FileUnzipEvent } from '../../../../shared/models/unzip.model';
import { Mod } from '../models/mod';
import { UserSettingModel } from '../../../../shared/models/user-setting.model';

export interface IndexedMods {
  name?: string;
  version?: string;
  link?: string;
}

@Injectable({
  providedIn: 'root',
})
export class DownloadService {
  private readonly MAX_CACHE_DURATION = 3600000; // 1 hour in milliseconds
  #electronService = inject(ElectronService);
  #userSettingsService = inject(UserSettingsService);
  #modListService = inject(ModListService);
  #httpClient = inject(HttpClient);

  mods: IndexedMods[] = [];
  lastFetchTime: Date | null = null;
  activeModList = this.#modListService.modListSignal;
  keepTemporaryDownloadDirectory = this.#userSettingsService.keepTempDownloadDirectory;

  isDownloadAndInstallInProgress = new BehaviorSubject(false);
  isDownloadProcessCompleted = new BehaviorSubject<boolean>(false);
  downloadProgressEvent = new BehaviorSubject<void>(void 0);

  async downloadAndInstallAll(): Promise<void> {
    this.isDownloadAndInstallInProgress.next(true);
    this.isDownloadProcessCompleted.next(false);
    const activeInstance = this.#userSettingsService.userSettingSignal().find(us => us.isActive);
    if (!activeInstance) {
      return;
    }

    for (let i = 0; i < this.activeModList().length; i++) {
      const mod = this.activeModList()[i];
      if (mod.installProgress?.completed) {
        continue;
      }

      const fileId = mod.id;
      if (!fileId || !mod.installProgress) {
        continue;
      }

      try {
        await this.installProcess(mod, fileId, activeInstance);
        await firstValueFrom(this.#userSettingsService.getCurrentTrackedModSetting(activeInstance));
      } catch (error: unknown) {
        mod.installProgress.error = true;
        this.handleError(mod, error as ApplicationElectronFileError);
        this.#modListService.updateMod();
        continue;
      }

      // TODO CHECK MOD DEPENDENCY
      // for (const modDependency of mod.dependencies ?? []) {
      //   const modDependencyHubId = modDependency.hubId ?? FileHelper.extractHubIdFromUrl(modDependency.fileUrl);
      //
      //   modDependency.installProgress = this.#modListService.initialInstallProgress();
      //   if (!modDependencyHubId || !modDependency.installProgress) {
      //     continue;
      //   }
      //
      //   const alreadyInstalledMods = this.#userSettingsService.getActiveInstance()?.trackedMods?.map(m => m.hubId);
      //   if (alreadyInstalledMods?.includes(modDependency.hubId ?? '')) {
      //     modDependency.installProgress.completed = true;
      //     continue;
      //   }
      //
      //   try {
      //     await this.installProcess(modDependency, modDependencyHubId, activeInstance);
      //     await firstValueFrom(this.#userSettingsService.getCurrentTrackedModSetting(activeInstance));
      //   } catch (error: unknown) {
      //     modDependency.installProgress.error = true;
      //     this.handleError(modDependency, error as ApplicationElectronFileError);
      //     this.#modListService.updateMod();
      //   }
      // }

      await firstValueFrom(this.#electronService.sendEvent('remove-mod-list-cache', mod.name));
    }

    if (!this.keepTemporaryDownloadDirectory()) {
      await firstValueFrom(this.#electronService.sendEvent('clear-temp', activeInstance.sptRootDirectory));
    }

    this.isDownloadAndInstallInProgress.next(false);
    this.isDownloadProcessCompleted.next(true);
  }

  private async installProcess(mod: Mod, hubId: number, activeInstance: UserSettingModel) {
    if (!mod?.installProgress) {
      return;
    }
    if (mod.installProgress?.error) {
      mod.installProgress = this.#modListService.initialInstallProgress();
    }

    this.#modListService.updateMod();

    this.#electronService.getDownloadModProgressForFileId().subscribe((progress: DownloadProgress) => {
      if (mod.installProgress!.error) {
        return;
      }
      mod.installProgress!.downloadStep.percent = progress.percent;
      mod.installProgress!.downloadStep.totalBytes = FileHelper.fileSize(+progress.totalBytes);
      mod.installProgress!.downloadStep.transferredBytes = FileHelper.fileSize(+progress.transferredBytes);
      this.downloadProgressEvent.next();
    });

    console.log(mod);
    const downloadModel: DownloadModel = {
      hubId,
      name: mod.name,
      sptInstancePath: activeInstance.sptRootDirectory,
      modFileUrl: mod.source_code_url,
    };

    await this.#electronService
      .sendEvent<string, DownloadModel>('download-mod', downloadModel)
      .pipe(
        switchMap(downloadFilePath => {
          const test: FileUnzipEvent = {
            name: mod.name,
            // TODO version: mod.modVersion,
            filePath: downloadFilePath?.args,
            instancePath: activeInstance.sptRootDirectory,
            hubId,
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

  private handleError(mod: Mod, error: ApplicationElectronFileError) {
    if (!mod.installProgress) {
      return;
    }

    switch (error) {
      case ApplicationElectronFileError.unzipError:
        mod.installProgress.unzipStep.error = true;
        mod.installProgress.unzipStep.progress = 1;
        break;
      case ApplicationElectronFileError.downloadError:
        mod.installProgress.downloadStep.error = true;
        mod.installProgress.downloadStep.percent = 100;
        break;
    }
  }
}

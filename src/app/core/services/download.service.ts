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
import { environment } from '../../../environments/environment';

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

  async getModData(): Promise<IndexedMods[]> {
    const currentTime = new Date();
    if (this.lastFetchTime && currentTime.getTime() - this.lastFetchTime.getTime() < this.MAX_CACHE_DURATION && this.mods && this.mods.length > 0) {
      console.log('Using cached indexed mods data');
      return this.mods;
    }

    console.log('Fetching indexed mods data from hub json');

    try {
      const response = await firstValueFrom(
        this.#httpClient.get<{
          mod_data: IndexedMods[];
        }>(environment.sptHubModsJson)
      );
      this.mods = response.mod_data;
      this.lastFetchTime = new Date();
      return this.mods;
    } catch (error) {
      console.error('Failed to load mods:', error);
      throw new Error('Failed to load mods');
    }
  }

  async downloadAndInstallAll(): Promise<void> {
    this.isDownloadAndInstallInProgress.next(true);
    this.isDownloadProcessCompleted.next(false);
    const activeInstance = this.#userSettingsService.userSettingSignal().find(us => us.isActive);
    if (!activeInstance) {
      return;
    }

    await this.getModData();

    for (let i = 0; i < this.activeModList().length; i++) {
      const mod = this.activeModList()[i];
      if (mod.installProgress?.completed) {
        continue;
      }

      const fileId = FileHelper.extractHubIdFromUrl(mod.fileUrl);
      if (!fileId || !mod.installProgress) {
        continue;
      }

      try {
        await this.installProcess(mod, fileId, activeInstance);
      } catch (error: unknown) {
        mod.installProgress.error = true;
        this.handleError(mod, error as ApplicationElectronFileError);
        this.#modListService.updateMod();
        continue;
      }

      for (const modDependency of mod.dependencies ?? []) {
        const modDependencyHubId = FileHelper.extractHubIdFromUrl(modDependency.fileUrl);

        modDependency.installProgress = this.#modListService.initialInstallProgress();
        if (!modDependencyHubId || !modDependency.installProgress) {
          continue;
        }

        const alreadyInstalledMods = this.#userSettingsService.getActiveInstance()?.trackedMods?.map(m => m.hubId);
        if (alreadyInstalledMods?.includes(modDependency.hubId ?? '')) {
          modDependency.installProgress.completed = true;
          continue;
        }

        try {
          await this.installProcess(modDependency, modDependencyHubId, activeInstance);
        } catch (error: unknown) {
          modDependency.installProgress.error = true;
          this.handleError(modDependency, error as ApplicationElectronFileError);
          this.#modListService.updateMod();
        }
      }

      await firstValueFrom(this.#electronService.sendEvent('remove-mod-list-cache', mod.name));
    }

    if (!this.keepTemporaryDownloadDirectory()) {
      await firstValueFrom(this.#electronService.sendEvent('clear-temp', activeInstance.sptRootDirectory));
    }

    this.isDownloadAndInstallInProgress.next(false);
    this.isDownloadProcessCompleted.next(true);
  }

  private async installProcess(mod: Mod, fileId: string, activeInstance: UserSettingModel) {
    if (!mod?.installProgress) {
      return;
    }
    if (mod?.installProgress?.error) {
      mod.installProgress = this.#modListService.initialInstallProgress();
    }

    mod.installProgress.linkStep.start = true;
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

    const linkModel: LinkModel = {
      fileId,
      sptInstancePath: activeInstance.sptRootDirectory ?? activeInstance.akiRootDirectory,
      downloadUrl: '',
    };

    const modData = this.mods.find(modItem => modItem.name === mod.name);
    if (this.#modListService.useIndexedModsSignal() && modData) {
      linkModel.downloadUrl = modData.link ?? '';
    }

    await this.#electronService
      .sendEvent<string, LinkModel>('download-link', linkModel)
      .pipe(
        switchMap(downloadLinkEvent => {
          mod.installProgress!.linkStep.progress = 1;

          const downloadModel: DownloadModel = {
            hubId: fileId,
            name: mod.name,
            sptInstancePath: activeInstance.sptRootDirectory,
            modFileUrl: downloadLinkEvent!.args,
          };

          return this.#electronService.sendEvent<string, DownloadModel>('download-mod', downloadModel);
        }),
        switchMap(downloadFilePath => {
          const test: FileUnzipEvent = {
            name: mod.name,
            version: mod.modVersion,
            filePath: downloadFilePath?.args,
            instancePath: activeInstance.sptRootDirectory,
            hubId: fileId,
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
      case ApplicationElectronFileError.downloadLinkError:
        mod.installProgress.linkStep.error = true;
        mod.installProgress.linkStep.progress = 1;
        break;
    }
  }
}

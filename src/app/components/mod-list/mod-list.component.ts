import { ChangeDetectorRef, Component, computed, inject, NgZone, OnInit } from '@angular/core';
import { ModItem, ModListService } from '../../core/services/mod-list.service';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgForOf, NgIf, NgOptimizedImage } from '@angular/common';
import { ModCardComponent, ModDownloadProgress, ModItemDownloadProgress } from '../mod-card/mod-card.component';
import { ElectronService } from '../../core/services/electron.service';
import { FileHelper } from '../../core/helper/file-helper';
import { firstValueFrom } from 'rxjs';
import { DownloadModel } from '../../../../shared/models/aki-core.model';
import { UserSettingsService } from '../../core/services/user-settings.service';
import { ApplicationElectronFileError } from '../../core/events/electron.events';

@Component({
  standalone: true,
  selector: 'app-mod-list',
  imports: [MatButtonModule, MatCardModule, MatIconModule, MatTooltipModule, NgForOf, NgOptimizedImage, ModCardComponent, NgIf],
  templateUrl: './mod-list.component.html',
  styleUrl: './mod-list.component.scss',
})
export default class ModListComponent implements OnInit {
  #modListService = inject(ModListService);
  #electronService = inject(ElectronService);
  #userSettingsService = inject(UserSettingsService);
  #ngZone = inject(NgZone);
  #changeDetectorRef = inject(ChangeDetectorRef);

  activeModList: ModItemDownloadProgress[] = []; // Non-reactive array
  isDownloadAndInstallInProgress = false;
  modListSignal = computed(() => this.#modListService.modListSignal().map(m => this.getModItemDownload(m) as ModItemDownloadProgress));

  ngOnInit() {
    this.activeModList = [...this.modListSignal()];
  }

  async downloadAndInstall(): Promise<void> {
    this.isDownloadAndInstallInProgress = true;
    const activeInstance = this.#userSettingsService.userSettingSignal().find(us => us.isActive);
    if (!activeInstance) {
      return;
    }

    for (let i = 0; i < this.activeModList.length; i++) {
      const modItemDownload = this.activeModList[i];
      const fileId = FileHelper.extractFileIdFromUrl(modItemDownload.modFileUrl);
      if (!fileId) {
        continue;
      }

      try {
        this.#electronService.getDownloadModProgressForFileId().subscribe((progress: ModDownloadProgress) => {
          this.#ngZone.run(() => {
            modItemDownload.percent = progress.percent;
            modItemDownload.totalBytes = FileHelper.fileSize(+progress.totalBytes);
            modItemDownload.transferredBytes = FileHelper.fileSize(+progress.transferredBytes);
            this.#changeDetectorRef.markForCheck();
          });
        });

        modItemDownload.downloadLinkStart = true;
        const downloadLinkEvent = await firstValueFrom(this.#electronService.sendEvent<string>('download-link', fileId));
        this.#ngZone.run(() => {
          modItemDownload.downloadLinkProgress = 1;
          this.#changeDetectorRef.markForCheck();
        });

        modItemDownload.downloadLinkProgress = 1;
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
        modItemDownload.unzipStart = true;
        await firstValueFrom(this.#electronService.sendEvent<any>('file-unzip', test));
        this.#ngZone.run(() => {
          modItemDownload.unzipProgress = 1;
          this.isDownloadAndInstallInProgress = false;
          this.#changeDetectorRef.markForCheck();
        });
      } catch (error) {
        switch (error) {
          case ApplicationElectronFileError.unzipError:
            this.#ngZone.run(() => {
              console.error(error);
              modItemDownload.unzipError = true;
              modItemDownload.unzipProgress = 1;
              this.#changeDetectorRef.markForCheck();
            });
            break;
          case ApplicationElectronFileError.downloadError:
          case ApplicationElectronFileError.downloadLinkError:
            break;
        }
      }
    }

    this.isDownloadAndInstallInProgress = false;
  }

  removeMod(modItem: ModItemDownloadProgress) {
    this.activeModList = this.activeModList.filter(m => m.modName !== modItem.modName);
    this.#modListService.deleteModToModList(modItem.modName);
  }

  private getModItemDownload(m: ModItem): ModItemDownloadProgress {
    return {
      ...m,
      transferredBytes: '0',
      totalBytes: '0',
      percent: 0,
      downloadLinkProgress: 0,
      unzipProgress: 0,
      downloadLinkStart: false,
      unzipStart: false,
      downloadLinkError: false,
      downloadModError: false,
      unzipError: false,
    };
  }
}

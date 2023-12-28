import { ChangeDetectorRef, Component, inject, NgZone } from '@angular/core';
import { ModListService } from '../../core/services/mod-list.service';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgForOf, NgOptimizedImage } from '@angular/common';
import { ModCardComponent, ModDownloadProgress, ModItemDownloadProgress } from '../mod-card/mod-card.component';
import { ElectronService } from '../../core/services/electron.service';
import { FileHelper } from '../../core/helper/file-helper';
import { firstValueFrom } from 'rxjs';
import { DownloadModel } from '../../../../shared/models/aki-core.model';
import { UserSettingsService } from '../../core/services/user-settings.service';
import { ApplicationElectronFileError } from '../../core/events/electron.events';

@Component({
  selector: 'app-mod-list',
  standalone: true,
  // TODO REMOVE?
  providers: [ElectronService],
  imports: [MatButtonModule, MatCardModule, MatIconModule, MatTooltipModule, NgForOf, NgOptimizedImage, ModCardComponent],
  templateUrl: './mod-list.component.html',
  styleUrl: './mod-list.component.scss',
})
export default class ModListComponent {
  #modListService = inject(ModListService);
  #electronService = inject(ElectronService);
  #userSettingsService = inject(UserSettingsService);
  #ngZone = inject(NgZone);
  #changeDetectorRef = inject(ChangeDetectorRef);

  modListSignal = this.#modListService
    .modListSignal()
    .map(m => ({ ...m, transferredBytes: '0', totalBytes: '0', percent: 0, downloadLinkProgress: 0, unzipProgress: 0 }) as ModItemDownloadProgress);

  async downloadAndInstall(): Promise<void> {
    const activeInstance = this.#userSettingsService.userSettingSignal().find(us => us.isActive);
    if (!activeInstance) {
      return;
    }

    for (const modItemDownload of this.modListSignal) {
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
        await firstValueFrom(this.#electronService.sendEvent<any>('file-unzip', test));
        this.#ngZone.run(() => {
          modItemDownload.unzipProgress = 1;
          this.#changeDetectorRef.markForCheck();
        });
      } catch (error) {
        switch (error as ApplicationElectronFileError) {
          case ApplicationElectronFileError.unzipError:
            this.#ngZone.run(() => {
              console.error(error);
              modItemDownload.unzipError = true;
              modItemDownload.unzipProgress = 1;
              this.#changeDetectorRef.markForCheck();
            });
        }
      }
    }
  }
}

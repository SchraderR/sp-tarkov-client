import { ChangeDetectorRef, Component, inject, Input, NgZone } from '@angular/core';
import { ModItem } from '../../core/services/mod-list.service';
import { MatCardModule } from '@angular/material/card';
import { NgOptimizedImage } from '@angular/common';
import { ElectronService } from '../../core/services/electron.service';
import { MatButtonModule } from '@angular/material/button';
import { finalize, Subscription, switchMap } from 'rxjs';
import { DownloadModel } from '../../../../shared/models/aki-core.model';
import { UserSettingsService } from '../../core/services/user-settings.service';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface ModDownloadProgress {
  percent: number;
  totalBytes: string;
  transferredBytes: string;
}

@Component({
  selector: 'app-mod-card',
  standalone: true,
  providers: [ElectronService],
  imports: [MatCardModule, NgOptimizedImage, MatButtonModule, MatProgressBarModule, MatTooltipModule],
  templateUrl: './mod-card.component.html',
  styleUrl: './mod-card.component.scss',
})
export class ModCardComponent {
  #electronService = inject(ElectronService);
  #userSettingsService = inject(UserSettingsService);
  #ngZone = inject(NgZone);
  #changeDetectorRef = inject(ChangeDetectorRef);

  private downloadSubscription: Subscription | undefined;
  private electronSubscription: Subscription | undefined;

  @Input({ required: true }) modItem!: ModItem;

  downloadLinkProgress = 0;
  downloadModProgress: ModDownloadProgress | null = null;
  unzipModProgress = 0;

  download(modItem: ModItem): void {
    console.log(modItem);
    this.downloadSubscription?.unsubscribe();
    this.electronSubscription?.unsubscribe();

    this.downloadLinkProgress = 0;
    this.downloadModProgress = null;
    this.unzipModProgress = 0;

    const activeInstance = this.#userSettingsService.userSettingSignal().find(us => us.isActive);
    if (!activeInstance) {
      return;
    }

    const url = new URL(modItem.modFileUrl);
    const regex = /\/file\/(\d+)-/;

    const match = url.pathname.match(regex);
    if (match !== null) {
      console.log(match[1]);
    } else {
      console.log('No match');
    }
    const fileId = match?.[1];
    if (!fileId) {
      return;
    }

    this.downloadSubscription = this.#electronService.getDownloadModProgress(fileId).subscribe((progress: ModDownloadProgress) => {
      this.#ngZone.run(() => {
        console.log(progress);
        this.downloadModProgress = {
          percent: progress.percent,
          totalBytes: this.fileSize(+progress.totalBytes),
          transferredBytes: this.fileSize(+progress.transferredBytes),
        };
        this.#changeDetectorRef.detectChanges();
      });
    });

    this.electronSubscription = this.#electronService
      .sendEvent<string>('download-link', fileId)
      .pipe(
        switchMap(downloadLink => {
          this.#ngZone.run(() => {
            this.downloadLinkProgress = 1;
            this.#changeDetectorRef.detectChanges();
          });

          const downloadModel: DownloadModel = {
            fileId,
            akiInstancePath: activeInstance.akiRootDirectory,
            modFileUrl: downloadLink!.args,
          };

          return this.#electronService.sendEvent<any, DownloadModel>('download-mod', downloadModel);
        })
      )
      .subscribe(v => {
        this.#ngZone.run(() => {
          console.log(v);
          this.unzipModProgress = 100;
          this.#changeDetectorRef.detectChanges();
        });
      });
  }

  private fileSize(size: number): string {
    if (size <= 0) return '0 Bytes';

    const units = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(size) / Math.log(1024));

    return parseFloat((size / Math.pow(1024, i)).toFixed(2)) + ' ' + units[i];
  }
}

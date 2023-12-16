import { ChangeDetectorRef, Component, DestroyRef, inject, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GithubService } from '../../core/services/github.service';
import { MatButtonModule } from '@angular/material/button';
import { ElectronService } from '../../core/services/electron.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { UserSettingsService } from '../../core/services/user-settings.service';
import { DownloadModel } from '../../../../shared/models/aki-core.model';

@Component({
  standalone: true,
  selector: 'app-github-release-list',
  templateUrl: './github-release-list.component.html',
  styleUrls: ['./github-release-list.component.scss'],
  imports: [CommonModule, MatButtonModule],
  providers: [GithubService],
})
export default class GithubReleaseListComponent {
  #ngZone = inject(NgZone);
  #httpClient = inject(HttpClient);
  #electronService = inject(ElectronService);
  #changeDetectorRef = inject(ChangeDetectorRef);
  #userSettingsService = inject(UserSettingsService);

  title = '';
  downloadLink = '';

  constructor() {
    this.#electronService
      .sendEvent<string>('download-link')
      .pipe(takeUntilDestroyed())
      .subscribe(res => {
        this.#ngZone.run(() => {
          this.downloadLink = res!.args;
          this.#changeDetectorRef.detectChanges();
        });
      });

    this.#httpClient
      .get('https://hub.sp-tarkov.com/files/file/813', { responseType: 'text' })
      .pipe(takeUntilDestroyed())
      .subscribe(hubViewString => {
        const hubViewHtml = this.parseStringAsHtml(hubViewString);
        this.setModTitle(hubViewHtml);
      });
  }

  startDownload() {
    const activeInstance = this.#userSettingsService.userSettingSignal().find(us => us.isActive);
    if (!activeInstance) {
      return;
    }

    const downloadModel: DownloadModel = {
      url: this.downloadLink,
      akiInstancePath: activeInstance.akiRootDirectory,
    };

    this.#electronService
      .sendEvent<any, DownloadModel>('download-mod', downloadModel)
      .pipe(takeUntilDestroyed())
      .subscribe(res => {
        console.log(res);
      });
  }

  private setModTitle(htmlDoc: Document) {
    this.title = htmlDoc.head.getElementsByTagName('title')[0].innerHTML;

    if (this.title.includes(' - AKI Mods Workshop')) {
      this.title = this.title.replace(' - AKI Mods Workshop', '');
    }
  }

  private parseStringAsHtml = (hubViewData: string) => new DOMParser().parseFromString(hubViewData, 'text/html');
}

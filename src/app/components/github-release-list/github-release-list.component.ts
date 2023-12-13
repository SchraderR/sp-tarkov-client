import { ChangeDetectorRef, Component, DestroyRef, inject, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GithubService } from '../../core/services/github.service';
import { MatButtonModule } from '@angular/material/button';
import { ElectronService } from '../../core/services/electron.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';

@Component({
  standalone: true,
  selector: 'app-github-release-list',
  templateUrl: './github-release-list.component.html',
  styleUrls: ['./github-release-list.component.scss'],
  imports: [CommonModule, MatButtonModule],
  providers: [GithubService],
})
export default class GithubReleaseListComponent {
  #destroyRef = inject(DestroyRef);
  #electronService = inject(ElectronService);
  #changeDetectorRef = inject(ChangeDetectorRef);
  #ngZone = inject(NgZone);
  #httpClient = inject(HttpClient);

  title = '';
  downloadLink = '';

  constructor() {
    this.#electronService
      .sendEvent<string>('download-link', 'download-link-complete')
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe(res => {
        this.#ngZone.run(() => {
          this.downloadLink = res!.args;
          this.#changeDetectorRef.detectChanges();
        });
      });

    this.#httpClient
      .get('https://hub.sp-tarkov.com/files/file/813', { responseType: 'text' })
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe(hubViewString => {
        const hubViewHtml = this.parseStringAsHtml(hubViewString);
        this.setModTitle(hubViewHtml);
      });
  }

  startDownload() {
    this.#electronService.sendEvent<string>('download-mod', "download-mod-completed", false, this.downloadLink)
      .pipe(takeUntilDestroyed(this.#destroyRef))
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
  protected readonly onabort = onabort;
}

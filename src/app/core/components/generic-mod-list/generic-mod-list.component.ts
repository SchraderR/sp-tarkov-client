import { AfterViewInit, Component, DestroyRef, inject, Input, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AsyncPipe, NgOptimizedImage, CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ElectronService } from '../../services/electron.service';
import { ModListService } from '../../services/mod-list.service';
import { UserSettingsService } from '../../services/user-settings.service';
import { Mod } from '../../models/mod';
import { restrictedModList } from '../../../constants';
import { IsAlreadyInstalledDirective } from '../../directives/is-already-installed.directive';
import { environment } from '../../../../environments/environment';
import { HtmlHelper } from '../../helper/html-helper';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { debounceTime, Subscription } from 'rxjs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSelectModule } from '@angular/material/select';
import { DownloadService } from '../../services/download.service';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

export type GenericModListSortField = 'cumulativeLikes' | 'time' | 'lastChangeTime' | 'downloads';
export type GenericModListSortOrder = 'ASC' | 'DESC';

@Component({
  standalone: true,
  selector: 'app-generic-mod-list',
  templateUrl: './generic-mod-list.component.html',
  styleUrls: ['./generic-mod-list.component.scss'],
  imports: [
    CommonModule, // Make sure CommonModule is imported here
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    RouterLink,
    MatTooltipModule,
    NgOptimizedImage,
    IsAlreadyInstalledDirective,
    MatPaginatorModule,
    MatToolbarModule,
    MatSelectModule,
    AsyncPipe,
    MatProgressSpinner,
  ],
})
export default class GenericModListComponent implements AfterViewInit {
  private paginatorSubscription: Subscription | undefined;
  private _sortField: GenericModListSortField | undefined;
  @ViewChild(MatPaginator) paginator: MatPaginator | undefined;

  @Input() set sortField(sortValue: GenericModListSortField) {
    this._sortField = sortValue;
    this.loadData(sortValue);
  }

  @Input() sortOrder: GenericModListSortOrder = 'DESC';

  #httpClient = inject(HttpClient);
  #electronService = inject(ElectronService);
  #modListService = inject(ModListService);
  #userSettingsService = inject(UserSettingsService);
  #destroyRef = inject(DestroyRef);
  #downloadService = inject(DownloadService);

  accumulatedModList: Mod[] = [];
  pageSize = 0;
  pageLength = 0;
  pageNumber = 0;
  loading = false;
  isDownloadAndInstallInProgress = this.#downloadService.isDownloadAndInstallInProgress;

  ngAfterViewInit() {
    this.paginatorSubscription = this.paginator?.page.pipe(debounceTime(250), takeUntilDestroyed(this.#destroyRef)).subscribe((event: PageEvent) => {
      if (!this._sortField) {
        return;
      }

      this.loadData(this._sortField, event.pageIndex);
    });
  }

  isActiveAkiInstanceAvailable = () => !!this.#userSettingsService.getActiveInstance();

  refresh() {
    this.loadData(this._sortField ?? 'cumulativeLikes', this.pageNumber);
  }

  addModToModList(mod: Mod) {
    this.#modListService.addMod(mod);
  }

  removeModFromModList(mod: Mod) {
    this.#modListService.removeMod(mod.name);
  }

  openExternal(modFileUrl: string) {
    void this.#electronService.shell.openExternal(modFileUrl);
  }

  getLastUpdateDate(lastUpdate: Date): string {
    const now: Date = new Date();
    const diff: number = now.getTime() - lastUpdate.getTime();
    const seconds: number = Math.floor(diff / 1000);
    const minutes: number = Math.floor(seconds / 60);
    const hours: number = Math.floor(minutes / 60);
    const days: number = Math.floor(hours / 24);

    if (days > 0) {
      if (days === 1) {
        return 'Yesterday, ' + lastUpdate.toLocaleTimeString();
      } else {
        return days + ' days ago';
      }
    } else if (hours > 0) {
      return hours === 1 ? '1 hour ago' : hours + ' hours ago';
    } else if (minutes > 0) {
      return minutes === 1 ? '1 minute ago' : minutes + ' minutes ago';
    } else {
      return 'Just now';
    }
  }

  private filterCoreMods(mod: Mod) {
    return !restrictedModList.includes(mod.name);
  }

  private loadData(sortValue: GenericModListSortField, pageNumber = 0) {
    this.loading = true;
    this.#httpClient
      .get(`${environment.akiFileBaseLink}/?pageNo=${pageNumber + 1}&sortField=${sortValue}&sortOrder=${this.sortOrder}`, { responseType: 'text' })
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe(pestRatedViewString => {
        const modView = HtmlHelper.parseStringAsHtml(pestRatedViewString);
        const modList = modView.body.getElementsByClassName('filebaseFileCard');

        const elements = modView.querySelectorAll('.paginationTop .pagination ul li:not([class])');
        const pageNumbers = Array.from(elements).map(li => parseInt(li.textContent ?? ''));

        this.accumulatedModList = Array.from(modList)
          .map(e => {
            const datetimeAttribute = e.getElementsByClassName('filebaseFileMetaData')[0]?.getElementsByClassName('datetime')[0]?.getAttribute('datetime');
            const date = datetimeAttribute ? new Date(datetimeAttribute) : null;

            return {
              name: e.getElementsByClassName('filebaseFileSubject')[0]?.getElementsByTagName('span')[0]?.innerHTML ?? '',
              fileUrl: e.getElementsByTagName('a')[0]?.href ?? '',
              image: e.getElementsByClassName('filebaseFileIcon')[0]?.getElementsByTagName('img')[0]?.src ?? null,
              icon: e.getElementsByClassName('filebaseFileIcon')[0]?.getElementsByTagName('span')[0]?.className.split('icon icon128')[1] ?? null,
              teaser: e.getElementsByClassName('filebaseFileTeaser')[0]?.innerHTML ?? '',
              supportedAkiVersion: e.getElementsByClassName('labelList')[0]?.getElementsByClassName('badge label')[0]?.innerHTML ?? '',
              akiVersionColorCode: e.getElementsByClassName('labelList')[0]?.getElementsByClassName('badge label')[0]?.className ?? '',
              kind: undefined,
              lastUpdate: date,
              isUpToDate: false,
              isInstalled: false
            };
          })
          .filter(e => this.filterCoreMods(e))
          .map(mod => {
            const installedMod = this.#modListService.getInstalledMods().find(m => m.name === mod.name);
            if (installedMod) {
              mod.isUpToDate = !!installedMod.lastUpdate && !!mod.lastUpdate && new Date(installedMod.lastUpdate).getTime() === new Date(mod.lastUpdate).getTime();
              mod.isInstalled = true;
            }
            
            return mod;
          });

        this.pageNumber = pageNumber;
        this.pageSize = this.accumulatedModList.length;
        this.pageLength = pageNumbers[pageNumbers.length - 1] * 20;
        this.loading = false;
      });
  }
}

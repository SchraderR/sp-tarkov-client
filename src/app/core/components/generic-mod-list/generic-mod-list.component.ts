import { AfterViewInit, Component, DestroyRef, inject, Input, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule, NgOptimizedImage } from '@angular/common';
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

export type GenericModListSortField = 'cumulativeLikes' | 'time';
export type GenericModListSortOrder = 'ASC' | 'DESC';

@Component({
  standalone: true,
  selector: 'app-generic-mod-list',
  templateUrl: './generic-mod-list.component.html',
  styleUrl: './generic-mod-list.component.scss',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    RouterLink,
    MatTooltipModule,
    NgOptimizedImage,
    IsAlreadyInstalledDirective,
    MatPaginatorModule,
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

  accumulatedModList: Mod[] = [];
  pageSize = 0;
  pageLength = 0;

  ngAfterViewInit() {
    this.paginatorSubscription = this.paginator?.page.pipe(debounceTime(250), takeUntilDestroyed(this.#destroyRef)).subscribe((event: PageEvent) => {
      if (!this._sortField) {
        return;
      }

      this.loadData(this._sortField, event.pageIndex);
    });
  }

  isActiveAkiInstanceAvailable = () => !!this.#userSettingsService.getActiveInstance();

  addModToModList(mod: Mod) {
    this.#modListService.addMod(mod);
  }

  removeModFromModList(mod: Mod) {
    this.#modListService.removeMod(mod.name);
  }

  openExternal(modFileUrl: string) {
    void this.#electronService.shell.openExternal(modFileUrl);
  }

  private filterCoreMods(mod: Mod) {
    return !restrictedModList.includes(mod.name);
  }

  private loadData(sortValue: GenericModListSortField, pageNumber = 0) {
    this.#httpClient
      .get(`${environment.akiFileBaseLink}/?pageNo=${pageNumber + 1}&sortField=${sortValue}&sortOrder=${this.sortOrder}`, { responseType: 'text' })
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe(pestRatedViewString => {
        const modView = HtmlHelper.parseStringAsHtml(pestRatedViewString);
        const modList = modView.body.getElementsByClassName('filebaseFileCard');

        const elements = modView.querySelectorAll('.paginationTop .pagination ul li:not([class])');
        const pageNumbers = Array.from(elements).map(li => parseInt(li.textContent ?? ''));

        this.accumulatedModList = Array.from(modList)
          .map(
            e =>
              ({
                name: e.getElementsByClassName('filebaseFileSubject')[0].getElementsByTagName('span')[0].innerHTML,
                fileUrl: e.getElementsByTagName('a')[0].href,
                image: e.getElementsByClassName('filebaseFileIcon')[0]?.getElementsByTagName('img')[0]?.src ?? null,
                icon: e.getElementsByClassName('filebaseFileIcon')[0]?.getElementsByTagName('span')[0]?.className.split('icon icon128')[1] ?? null,
                teaser: e.getElementsByClassName('filebaseFileTeaser')[0].innerHTML ?? '',
                kind: '',
              }) as Mod
          )
          .filter(e => this.filterCoreMods(e));

        this.pageSize = this.accumulatedModList.length;
        this.pageLength = pageNumbers[pageNumbers.length - 1] * 20;
      });
  }
}

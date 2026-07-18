import { AfterViewInit, Component, DestroyRef, inject, OnInit, input, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AsyncPipe, DatePipe, NgOptimizedImage, NgTemplateOutlet } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ElectronService } from '../../services/electron.service';
import { ModListService } from '../../services/mod-list.service';
import { UserSettingsService } from '../../services/user-settings.service';
import { Mod } from '../../models/mod';
import { IsAlreadyInstalledDirective } from '../../directives/is-already-installed.directive';
import { environment } from '../../../../environments/environment';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { debounceTime, firstValueFrom, map, Observable, startWith, Subscription, tap } from 'rxjs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSelectModule } from '@angular/material/select';
import { DownloadService } from '../../services/download.service';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { ConfigurationService } from '../../services/configuration.service';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatAutocomplete, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatInput } from '@angular/material/input';
import { SptTag, SptVersion } from '../../../../../shared/models/spt-core.model';
import { IsAlreadyStartedDirective } from '../../directives/is-already-started.directive';
import { ForgeApiService } from '../../services/forge-api.service';
import { MatButtonToggle, MatButtonToggleGroup } from '@angular/material/button-toggle';
import { SemverSptVersionPipe } from '../../pipes/semver-spt-version.pipe';
import { ModCacheModel } from '../../../../../shared/models/mod-cache.model';
import { MatDivider } from '@angular/material/list';

export type GenericModListSortType = 'name' | 'featured' | 'created_at' | 'updated_at' | 'published_at' | 'downloads';
export type GenericModListSortOrder = 'ASC' | 'DESC';

@Component({
  selector: 'app-generic-mod-list',
  templateUrl: './generic-mod-list.component.html',
  styleUrl: './generic-mod-list.component.scss',
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    IsAlreadyInstalledDirective,
    MatPaginatorModule,
    MatToolbarModule,
    MatSelectModule,
    AsyncPipe,
    MatProgressSpinner,
    ReactiveFormsModule,
    NgTemplateOutlet,
    MatAutocomplete,
    MatInput,
    MatAutocompleteTrigger,
    IsAlreadyStartedDirective,
    MatButtonToggleGroup,
    MatButtonToggle,
    NgOptimizedImage,
    SemverSptVersionPipe,
    DatePipe,
    MatDivider,
  ],
})
export default class GenericModListComponent implements OnInit, AfterViewInit {
  private fetchModSubscription: Subscription | undefined;

  readonly paginator = viewChild(MatPaginator);
  readonly tags = input<boolean>();

  private readonly forgeApiService = inject(ForgeApiService);
  private readonly electronService = inject(ElectronService);
  private readonly modListService = inject(ModListService);
  private readonly userSettingsService = inject(UserSettingsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly downloadService = inject(DownloadService);
  private readonly configurationService = inject(ConfigurationService);

  protected readonly Intl = Intl;

  sptVersionFormField = new FormControl<SptVersion | null>(null);
  sortTypeFormField = new FormControl<GenericModListSortType>('featured', { nonNullable: true });
  sortOrderFormField = new FormControl<GenericModListSortOrder>('DESC', { nonNullable: true });
  sptTagFormField = new FormControl(null);
  filteredOptions: Observable<SptTag[]> | undefined;

  accumulatedModList: Mod[] = [];
  pageSize = 1;
  pageLength = 0;
  pageNumber = 0;
  total = 0;
  loading = false;
  isDownloadAndInstallInProgress = this.downloadService.isDownloadAndInstallInProgress;

  sptVersionSignal = this.configurationService.sptVersionSignal;
  sptTagsSignal = this.configurationService.tagsSignal;

  ngOnInit() {
    this.sortTypeFormField.valueChanges.pipe(debounceTime(500), takeUntilDestroyed(this.destroyRef)).subscribe(() => this.loadData());
    this.sortOrderFormField.valueChanges.pipe(debounceTime(500), takeUntilDestroyed(this.destroyRef)).subscribe(() => this.loadData());

    this.sptVersionFormField.valueChanges.pipe(debounceTime(500), takeUntilDestroyed(this.destroyRef)).subscribe(() => this.loadData());

    this.filteredOptions = this.sptTagFormField.valueChanges.pipe(
      startWith(''),
      debounceTime(500),
      map(value => this.filterTags(value || '')),
      tap(() => this.loadData())
    );

    this.loadData();
  }

  ngAfterViewInit() {
    this.paginator()
      ?.page.pipe(debounceTime(250), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadData());
  }

  isActiveSptInstanceAvailable = () => !!this.userSettingsService.getActiveInstance();

  refresh() {
    this.loadData();
  }

  async addModToModList(mod: Mod) {
    const activeInstance = this.userSettingsService.getActiveInstance();
    if (!activeInstance) {
      throw new Error('Active instance not found');
    }

    await this.modListService.addMod(mod.id);
    const modCache: ModCacheModel = { modId: mod.id, instanceId: activeInstance.id };
    await firstValueFrom(this.electronService.sendEvent('add-mod-list-cache', modCache));
  }

  async removeModFromModList(mod: Mod) {
    const activeInstance = this.userSettingsService.getActiveInstance();
    if (!activeInstance) {
      throw new Error('Active instance not found');
    }

    this.modListService.removeMod(mod.name);
    const modCache: ModCacheModel = { modId: mod.id, instanceId: activeInstance.id };
    await firstValueFrom(this.electronService.sendEvent('remove-mod-list-cache', modCache));
  }

  openExternal(modFileUrl: string) {
    void this.electronService.openExternal(modFileUrl);
  }

  private loadData() {
    this.loading = true;
    const config = this.configurationService.configSignal();
    // CHECK WHEN TAGS ARE IMPLEMENTED
    // if (this.tags()) {
    //   const akiTag = this.sptTagsSignal()?.find(t => t.innerText === this.sptTagFormField.value);
    //   if (!akiTag) {
    //     this.loading = false;
    //     this.accumulatedModList = [];
    //     return;
    //   }
    //
    //   basePath = `${environment.sptFileTagBaseLink}${akiTag?.tagPath}?objectType=com.woltlab.filebase.file&pageNo=${pageNumber + 1}`;
    // } else {
    //   basePath = `${environment.sptFileBaseLink}/?pageNo=${pageNumber + 1}&sortField=${this.sortTypeFormField.value}&sortOrder=${this.sortOrderFormField.value}&labelIDs[1]=${this.sptVersionFormField.value?.dataLabelId}`;
    // }

    this.accumulatedModList = [];
    this.fetchModSubscription?.unsubscribe();
    this.fetchModSubscription = this.forgeApiService
      .getMods(this.sortTypeFormField.value, this.sortOrderFormField.value, this.sptVersionFormField.value, (this.paginator()?.pageIndex ?? 0) + 1)
      .subscribe(forgeModResult => {
        this.accumulatedModList = Array.from(forgeModResult.data)
          .map(mod => ({ ...mod }) as Mod)
          .map(e => {
            if (!config) {
              return e;
            }

            if (!environment.ignoreRemoteConfig) {
              e.notSupported = !!config.notSupported.find(f => f === e.id || f === e.hub_id);
            }

            return e;
          });

        window.scrollTo({ top: 0, behavior: 'smooth' });
        this.pageNumber = forgeModResult.meta.current_page;
        this.pageSize = forgeModResult.meta.per_page;
        this.pageLength = forgeModResult.meta.last_page;
        this.total = forgeModResult.meta.total;
        this.loading = false;
      });

    // this.fetchModSubscription = this.httpClient
    //   .get(basePath, { responseType: 'text' })
    //   .pipe(takeUntilDestroyed(this.destroyRef))
    //   .subscribe(pestRatedViewString => {
    //     const modView = HtmlHelper.parseStringAsHtml(pestRatedViewString);
    //     const modList = modView.body.getElementsByClassName('filebaseFileCard');
    //
    //     const elements = modView.querySelectorAll('.paginationTop .pagination ul li:not([class])');
    //     const pageNumbers = Array.from(elements).map(li => parseInt(li.textContent ?? ''));
    //
    //     this.accumulatedModList = Array.from(modList)
    //       .map(e => {
    //         const datetimeAttribute = e.querySelector('.filebaseFileMetaData .datetime')?.getAttribute('datetime');
    //         const date = datetimeAttribute ? new Date(datetimeAttribute) : undefined;
    //
    //         return {
    //           name: e.getElementsByClassName('filebaseFileSubject')[0].getElementsByTagName('span')[0].innerHTML,
    //           fileUrl: e.getElementsByTagName('a')[0].href,
    //           image: e.getElementsByClassName('filebaseFileIcon')[0]?.getElementsByTagName('img')[0]?.src ?? null,
    //           icon: e.getElementsByClassName('filebaseFileIcon')[0]?.getElementsByTagName('span')[0]?.className.split('icon icon128')[1] ?? null,
    //           teaser: e.getElementsByClassName('filebaseFileTeaser')[0].innerHTML ?? '',
    //           supportedSptVersion: e.getElementsByClassName('labelList')[0]?.getElementsByClassName('badge label')[0]?.innerHTML ?? '',
    //           sptVersionColorCode: e.getElementsByClassName('labelList')[0]?.getElementsByClassName('badge label')[0]?.className,
    //           kind: '',
    //           notSupported: false,
    //           lastUpdate: this.getLastUpdateText(date),
    //         } as Mod;
    //       })
    //       .filter(e => this.filterCoreMods(e))
    //       .map(e => {
    //         if (!config) {
    //           return e;
    //         }
    //
    //         const hubId = FileHelper.extractHubIdFromUrl(e.fileUrl);
    //         if (!hubId) {
    //           return e;
    //         }
    //         e.hubId = hubId;
    //
    //         if (!environment.ignoreRemoteConfig) {
    //           e.notSupported = !!config.notSupported.find(f => f === +hubId);
    //         }
    //
    //         return e;
    //       });
    //
    //     window.scrollTo({ top: 0, behavior: 'smooth' });
    //     this.pageNumber = pageNumber;
    //     this.pageSize = this.accumulatedModList.length;
    //     this.pageLength = pageNumbers.length !== 0 ? pageNumbers[pageNumbers.length - 1] * 20 : this.accumulatedModList.length;
    //     this.loading = false;
    //   });
  }

  private filterTags(value: string): SptTag[] {
    const filterValue = value.toLowerCase();
    if (!this.sptTagsSignal()?.length) {
      return [];
    }

    return this.sptTagsSignal()!.filter(option => option.innerText.toLowerCase().includes(filterValue));
  }
}

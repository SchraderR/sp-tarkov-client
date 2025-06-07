import { AfterViewInit, Component, DestroyRef, inject, Input, OnInit, input, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AsyncPipe, NgOptimizedImage, NgTemplateOutlet } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ElectronService } from '../../services/electron.service';
import { ModListService } from '../../services/mod-list.service';
import { UserSettingsService } from '../../services/user-settings.service';
import { Mod } from '../../models/mod';
import { IsAlreadyInstalledDirective } from '../../directives/is-already-installed.directive';
import { environment } from '../../../../environments/environment';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
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
import { ModCache } from '../../../../../shared/models/user-setting.model';
import { IsAlreadyStartedDirective } from '../../directives/is-already-started.directive';
import { CheckModDependencyDirective } from '../../directives/check-mod-dependency.directive';
import { ForgeApiService } from '../../services/forge-api.service';
import { MatButtonToggle, MatButtonToggleGroup } from '@angular/material/button-toggle';
import { ImagePathResolverPipe } from '../../pipes/image-path-resolver.pipe';
import { SemverSptVersionPipe } from '../../pipes/semver-spt-version.pipe';

export type GenericModListSortType = 'name' | 'featured' | 'created_at' | 'updated_at' | 'published_at';
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
    CheckModDependencyDirective,
    MatButtonToggleGroup,
    MatButtonToggle,
    ImagePathResolverPipe,
    NgOptimizedImage,
    SemverSptVersionPipe,
  ],
})
export default class GenericModListComponent implements OnInit, AfterViewInit {
  private fetchModSubscription: Subscription | undefined;

  readonly paginator = viewChild(MatPaginator);
  readonly tags = input<boolean>();

  private forgeApiService = inject(ForgeApiService);

  private electronService = inject(ElectronService);
  private modListService = inject(ModListService);
  private userSettingsService = inject(UserSettingsService);
  private destroyRef = inject(DestroyRef);
  private downloadService = inject(DownloadService);
  private configurationService = inject(ConfigurationService);

  sptVersionFormField = new FormControl<SptVersion | null>(null);
  sortTypeFormField = new FormControl<GenericModListSortType>('featured', { nonNullable: true });
  sortOrderFormField = new FormControl<GenericModListSortOrder>('DESC', { nonNullable: true });
  sptTagFormField = new FormControl(null);
  filteredOptions: Observable<SptTag[]> | undefined;

  accumulatedModList: Mod[] = [];
  pageSize = 0;
  pageLength = 0;
  pageNumber = 0;
  loading = false;
  isDownloadAndInstallInProgress = this.downloadService.isDownloadAndInstallInProgress;

  sptVersionSignal = this.configurationService.sptVersionSignal;
  sptTagsSignal = this.configurationService.tagsSignal;

  ngOnInit() {
    this.sortTypeFormField.valueChanges.pipe(debounceTime(500), takeUntilDestroyed(this.destroyRef)).subscribe(() => this.loadData(this.pageNumber));

    this.sortOrderFormField.valueChanges.pipe(debounceTime(500), takeUntilDestroyed(this.destroyRef)).subscribe(() => this.loadData(this.pageNumber));

    this.sptVersionFormField.valueChanges
      .pipe(debounceTime(500), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadData(this.pageNumber));

    this.filteredOptions = this.sptTagFormField.valueChanges.pipe(
      startWith(''),
      debounceTime(500),
      map(value => this.filterTags(value || '')),
      tap(() => this.loadData(this.pageNumber))
    );

    this.loadData(this.pageNumber);
  }

  ngAfterViewInit() {
    this.paginator()
      ?.page.pipe(debounceTime(250), takeUntilDestroyed(this.destroyRef))
      .subscribe((event: PageEvent) => this.loadData(event.pageIndex));
  }

  isActiveSptInstanceAvailable = () => !!this.userSettingsService.getActiveInstance();

  refresh() {
    this.loadData(this.pageNumber);
  }

  async addModToModList(mod: Mod) {
    console.log(mod);
    const modCacheItem: ModCache = { modId: mod.id, name: mod.name, thumbnail: mod.thumbnail, teaser: mod.teaser };

    await this.modListService.addMod(mod);
    await firstValueFrom(this.electronService.sendEvent('add-mod-list-cache', modCacheItem));
  }

  async removeModFromModList(mod: Mod) {
    this.modListService.removeMod(mod.name);
    await firstValueFrom(this.electronService.sendEvent('remove-mod-list-cache', mod.name));
  }

  openExternal(modFileUrl: string) {
    void this.electronService.shell.openExternal(modFileUrl);
  }

  getLastUpdateText(lastUpdate: Date | undefined): string {
    if (!lastUpdate) {
      return 'Unknown';
    }

    const now: Date = new Date();
    const diff: number = now.getTime() - lastUpdate.getTime();
    const seconds: number = Math.floor(diff / 1000);
    const minutes: number = Math.floor(seconds / 60);
    const hours: number = Math.floor(minutes / 60);
    const days: number = Math.floor(hours / 24);

    if (days > 0) {
      return days === 1 ? 'Yesterday, ' + lastUpdate.toLocaleTimeString() : `${days} days ago`;
    } else if (hours > 0) {
      return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
    } else if (minutes > 0) {
      return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
    } else {
      return 'Just now';
    }
  }

  private filterCoreMods(mod: Mod) {
    return !this.configurationService.configSignal()?.restrictedMods?.includes(mod.name);
  }

  private loadData(pageNumber = 0) {
    this.loading = true;
    const config = this.configurationService.configSignal();

    let basePath = '';

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
      .getMods(this.sortTypeFormField.value, this.sortOrderFormField.value, (this.paginator()?.pageIndex ?? 0) + 1)
      .subscribe(forgeModResult => {
        this.accumulatedModList = Array.from(forgeModResult.data)
          .map(mod => ({ ...mod }) as Mod)
          .filter(e => this.filterCoreMods(e))
          .map(e => {
            if (!config) {
              return e;
            }

            if (!environment.ignoreRemoteConfig) {
              e.notSupported = !!config.notSupported.find(f => f === e.hub_id);
            }

            return e;
          });

        console.log(this.accumulatedModList);

        window.scrollTo({ top: 0, behavior: 'smooth' });
        this.pageNumber = forgeModResult.meta.current_page;
        this.pageSize = forgeModResult.meta.per_page; // this.accumulatedModList.length;
        this.pageLength = forgeModResult.meta.last_page;
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

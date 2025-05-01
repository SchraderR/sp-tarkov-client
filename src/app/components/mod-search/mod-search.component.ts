import { Component, inject } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime, EMPTY, filter, firstValueFrom, map, startWith, switchMap } from 'rxjs';
import { SptSearchService } from '../../core/services/spt-search.service';
import { ModListService } from '../../core/services/mod-list.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Mod } from '../../core/models/mod';
import { IsAlreadyInstalledDirective } from '../../core/directives/is-already-installed.directive';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UserSettingsService } from '../../core/services/user-settings.service';
import { ElectronService } from '../../core/services/electron.service';
import { DownloadService } from '../../core/services/download.service';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { ModCache } from '../../../../shared/models/user-setting.model';
import { IsAlreadyStartedDirective } from '../../core/directives/is-already-started.directive';

@Component({
    selector: 'app-mod-search',
    imports: [
        CommonModule,
        MatAutocompleteModule,
        MatFormFieldModule,
        MatInputModule,
        MatOptionModule,
        NgOptimizedImage,
        ReactiveFormsModule,
        MatButtonModule,
        MatIconModule,
        IsAlreadyInstalledDirective,
        MatTooltipModule,
        MatProgressSpinner,
        IsAlreadyStartedDirective,
    ],
    templateUrl: './mod-search.component.html',
    styleUrl: './mod-search.component.scss'
})
export class ModSearchComponent {
  #sptSearchService = inject(SptSearchService);
  #modListService = inject(ModListService);
  #userSettingsService = inject(UserSettingsService);
  #electronService = inject(ElectronService);
  #downloadService = inject(DownloadService);

  isActiveSptInstanceAvailable = () => !!this.#userSettingsService.getActiveInstance();

  isLoading = false;
  searchControl = new FormControl('', Validators.minLength(2));
  filteredModItems: Mod[] = [];
  isDownloadAndInstallInProgress = this.#downloadService.isDownloadAndInstallInProgress;

  constructor() {
    this.searchControl.valueChanges
      .pipe(
        startWith(''),
        debounceTime(500),
        filter(() => this.searchControl.valid),
        switchMap(searchArgument => {
          this.filteredModItems = [];

          if (searchArgument?.trim()) {
            this.isLoading = true;
            return this.#sptSearchService.searchMods(searchArgument);
          } else {
            this.isLoading = false;
            return EMPTY;
          }
        }),
        map(mods => {
          this.isLoading = false;
          this.filteredModItems = mods.sort((a, b) => b.supportedSptVersion.localeCompare(a.supportedSptVersion));
        })
      )
      .subscribe();
  }

  openExternal = (licenseUrl: string) => void this.#electronService.openExternal(licenseUrl);

  async addModToModList(event: Event, mod: Mod) {
    event.stopPropagation();

    const modCacheItem: ModCache = {
      name: mod.name,
      icon: mod.icon,
      image: mod.image,
      fileUrl: mod.fileUrl,
      teaser: mod.teaser,
      supportedSptVersion: mod.supportedSptVersion,
      sptVersionColorCode: mod.sptVersionColorCode,
    };

    await this.#modListService.addMod(mod);
    await firstValueFrom(this.#electronService.sendEvent('add-mod-list-cache', modCacheItem));
  }

  async removeModFromModList(event: MouseEvent, mod: Mod) {
    event.stopPropagation();

    this.#modListService.removeMod(mod.name);
    await firstValueFrom(this.#electronService.sendEvent('remove-mod-list-cache', mod.name));
  }
}

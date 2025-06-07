import { Component, inject } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime, EMPTY, filter, firstValueFrom, map, startWith, switchMap } from 'rxjs';
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
import { ForgeApiService } from '../../core/services/forge-api.service';
import { ImagePathResolverPipe } from '../../core/pipes/image-path-resolver.pipe';
import { SemverSptVersionPipe } from '../../core/pipes/semver-spt-version.pipe';

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
    ImagePathResolverPipe,
    SemverSptVersionPipe,
  ],
  templateUrl: './mod-search.component.html',
  styleUrl: './mod-search.component.scss',
})
export class ModSearchComponent {
  private forgeApiService = inject(ForgeApiService);
  private modListService = inject(ModListService);
  private userSettingsService = inject(UserSettingsService);
  private electronService = inject(ElectronService);
  private downloadService = inject(DownloadService);

  isActiveSptInstanceAvailable = () => !!this.userSettingsService.getActiveInstance();

  isLoading = false;
  searchControl = new FormControl('', Validators.minLength(2));
  filteredModItems: Mod[] = [];
  isDownloadAndInstallInProgress = this.downloadService.isDownloadAndInstallInProgress;

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
            return this.forgeApiService.searchMod(searchArgument);
          } else {
            this.isLoading = false;
            return EMPTY;
          }
        }),
        map(mods => {
          this.isLoading = false;
          this.filteredModItems = mods.data.sort((a, b) => {
            if (a.versions && b.versions) {
              return b.versions[0].version.localeCompare(a.versions[0].version);
            }
            return 0;
          });
        })
      )
      .subscribe();
  }

  openExternal = (licenseUrl: string) => void this.electronService.openExternal(licenseUrl);

  async addModToModList(event: Event, mod: Mod) {
    console.log(mod);
    event.stopPropagation();

    const modCacheItem: ModCache = { modId: mod.id, name: mod.name, thumbnail: mod.thumbnail, teaser: mod.teaser };

    await this.modListService.addMod(mod);
    await firstValueFrom(this.electronService.sendEvent('add-mod-list-cache', modCacheItem));
  }

  async removeModFromModList(event: MouseEvent, mod: Mod) {
    event.stopPropagation();

    this.modListService.removeMod(mod.name);
    await firstValueFrom(this.electronService.sendEvent('remove-mod-list-cache', mod.name));
  }
}

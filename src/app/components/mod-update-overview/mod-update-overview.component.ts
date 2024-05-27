import { ChangeDetectorRef, Component, computed, DestroyRef, effect, inject, NgZone, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ElectronService } from '../../core/services/electron.service';
import { ModMeta, UpdateModMeta, UserSettingModel } from '../../../../shared/models/user-setting.model';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatTooltip } from '@angular/material/tooltip';
import { ModListService } from '../../core/services/mod-list.service';
import { UserSettingsService } from '../../core/services/user-settings.service';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { MatListItemMeta } from '@angular/material/list';
import { ModUpdateService } from './mod-update.service';
import { ConfigurationService } from '../../core/services/configuration.service';
import { closest, distance } from 'fastest-levenshtein';
import { IndexedMods } from '../../core/services/download.service';
import { NgArrayPipesModule } from 'ngx-pipes';
import { environment } from '../../../environments/environment';
import { catchError } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-mod-update-overview',
  templateUrl: './mod-update-overview.component.html',
  styleUrl: './mod-update-overview.component.scss',
  imports: [MatSlideToggle, ReactiveFormsModule, MatTooltip, MatIcon, MatIconButton, MatListItemMeta, NgArrayPipesModule],
  providers: [ModUpdateService],
})
export default class ModUpdateOverviewComponent implements OnInit {
  #httpClient = inject(HttpClient);
  #electronService = inject(ElectronService);
  #userSettingsService = inject(UserSettingsService);
  #modListService = inject(ModListService);
  #configurationService = inject(ConfigurationService);
  #destroyRef = inject(DestroyRef);
  #ngZone = inject(NgZone);
  #modUpdateService = inject(ModUpdateService);
  #changeDetectorRef = inject(ChangeDetectorRef);

  activeAkiInstance = this.#userSettingsService.getActiveInstance();
  useIndexedModsControl = new FormControl(this.#modListService.useIndexedModsSignal());

  notFound = 0;

  isInModList = computed(() => {
    const activeInstance = this.#userSettingsService.getActiveInstance();
    if (!activeInstance) {
      return [];
    }

    return [...activeInstance.serverMods, ...activeInstance.clientMods];
  });

  constructor() {
    effect(() => {
      const activeInstance = this.#userSettingsService.userSettingSignal().find(i => i.isActive);
      const indexedMods = this.#modListService.indexedModListSignal();
      const modMetaData = this.#configurationService.configSignal()?.modMetaData!;
      const config = this.#configurationService.configSignal();

      if (!activeInstance || !config) {
        return;
      }

      this.#modUpdateService.assignAlternativeNames(activeInstance.serverMods, config.alternativeModNames);
      this.#modUpdateService.assignAlternativeNames(activeInstance.clientMods, config.alternativeModNames);

      const flattenMetaModNames = this.flattenSubMods(modMetaData.map(m => ({ name: m.name }) as ModMeta));
      const flattenIndexedModNames = this.flattenSubMods(indexedMods.map(m => ({ name: m.name }) as ModMeta));
      const combinedModNames = [...flattenMetaModNames, ...flattenIndexedModNames];

      activeInstance.serverMods.forEach(mod => this.handleMod(mod, indexedMods, modMetaData, combinedModNames));
      activeInstance.clientMods.forEach(mod => this.handleMod(mod, indexedMods, modMetaData, combinedModNames));
    });
  }

  private handleMod(
    mod: ModMeta,
    indexedMods: IndexedMods[],
    modMetaData: {
      name: string;
      hubId: string;
    }[],
    flattenModNames: string[]
  ) {
    const indexedModAlternativeName = indexedMods.find(m => m.name === mod.alternativeName);
    const indexedModModName = indexedMods.find(m => m.name === mod.name);

    if (!!indexedModAlternativeName || !!indexedModModName) {
      mod.hubId = indexedModAlternativeName?.id ?? indexedModModName?.id;

      mod.subMods?.forEach(subMod => {
        this.handleMod(subMod, indexedMods, modMetaData, flattenModNames);
        if (subMod.hubId && !mod.hubId) {
          mod.hubId = subMod.hubId;
        }
      });

      return;
    }

    const closestAlternativeName = closest(mod.alternativeName ?? '', flattenModNames);
    const closestModName = closest(mod.name, flattenModNames);

    const isHubNameBasedOnLevenshtein = closestAlternativeName ? this.isMatchBasedOnLevenshtein(closestAlternativeName, mod.alternativeName) : false;
    const isModNameBasedOnLLevenshtein = closestModName ? this.isMatchBasedOnLevenshtein(closestModName, mod.name) : false;

    if (isHubNameBasedOnLevenshtein) {
      const item = modMetaData?.find(m => m.name === closestAlternativeName);
      mod.hubId = item?.hubId;

      mod.subMods?.forEach(subMod => {
        this.handleMod(subMod, indexedMods, modMetaData, flattenModNames);
        if (subMod.hubId && !mod.hubId) {
          mod.hubId = subMod.hubId;
        }
      });

      return;
    }

    if (isModNameBasedOnLLevenshtein) {
      const item = modMetaData?.find(m => m.name === closestModName);
      mod.hubId = item?.hubId;

      mod.subMods?.forEach(subMod => {
        this.handleMod(subMod, indexedMods, modMetaData, flattenModNames);
        if (subMod.hubId && !mod.hubId) {
          mod.hubId = subMod.hubId;
        }
      });

      return;
    }

    mod.subMods?.forEach(subMod => {
      this.handleMod(subMod, indexedMods, modMetaData, flattenModNames);
      if (subMod.hubId && !mod.hubId) {
        mod.hubId = subMod.hubId;
      }

      return;
    });
  }

  ngOnInit() {
    this.getCurrentModMetaData();
  }

  checkForUpdate(mod: ModMeta) {
    if (!mod?.hubId) {
      return;
    }
    this.#electronService.sendEvent<string, string>('update-mod-data', mod.hubId).subscribe(value => {
      this.#httpClient
        .get(`${value.args.split('https://hub.sp-tarkov.com/')[1]}`, { responseType: 'text' })
        .pipe(
          catchError(e => {
            console.log(e);
            console.log(e['headers']);
            return e;
          })
        )
        .subscribe(resp => {
          //console.log(resp);
          //console.log(resp['headers']);
          //if (resp.url != null) {
          //  // window.location.href = resp.url;
          //}
        });
    });
  }

  private isMatchBasedOnLevenshtein(stringA = '', stringB = '', threshold = 0.2): boolean {
    if (!stringA || !stringB) {
      return false;
    }

    const levenshteinDistance = distance(stringA, stringB);
    const averageLength = (stringA.length + stringB.length) / 2;

    const relativeDistance = levenshteinDistance / averageLength;

    return relativeDistance <= threshold;
  }

  openExternal(modPath: string) {
    this.#electronService.openPath(modPath);
  }

  private flattenSubMods(mods: ModMeta[]): string[] {
    return mods.flatMap(mod => [
      ...(mod.name ? [mod.name] : []),
      ...(mod.alternativeName ? [mod.alternativeName] : []),
      ...this.flattenSubMods(mod.subMods ?? []),
    ]);
  }

  private getCurrentModMetaData() {
    this.#electronService.sendEvent<string, string>('update-mod-data').subscribe(value => {
      // https://hub.sp-tarkov.com/files/file/1062-sain-2-0-solarint-s-ai-modifications-full-ai-combat-system-replacement/#versions
      // https://hub.sp-tarkov.com/files/
      // file/1062-sain-2-0-solarint-s-ai-modifications-full-ai-combat-system-replacement/#versions
      // console.log(value.args);
      //
      //this.#httpClient
      //  .get(`files/file/1062-sain-2-0-solarint-s-ai-modifications-full-ai-combat-system-replacement/#versions`, {
      //
      //    responseType: 'text',
      //  })
      //  .pipe(takeUntilDestroyed(this.#destroyRef))
      //  .subscribe(r => console.log(r));
    });
  }

  private async checkForUpdateFromIndexedList() {
    try {
      const indexedMods = this.#modListService.indexedModListSignal();

      // const updatesAvailable = response.filter(mod => {
      //   const indexedMod = indexedMods.find(indexedMod => indexedMod.modId === mod.modId);
      //   if (!indexedMod) {
      //     return true;
      //   }
      //
      //   // Or use a custom function to compare versions if it's not a simple number. E.g., '1.0.2'
      //   return indexedMod.version !== mod.version;
      // });

      // if (updatesAvailable.length > 0) {
      //   console.log('Updates Available: ', updatesAvailable);
      //   // Do something with the mods that need to be updated.
      // }
    } catch (error) {
      console.error('Error checking for updates:', error);
    }
  }
}

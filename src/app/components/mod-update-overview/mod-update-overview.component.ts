import { Component, computed, effect, inject } from '@angular/core';
import { ElectronService } from '../../core/services/electron.service';
import { ModMeta } from '../../../../shared/models/user-setting.model';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { ReactiveFormsModule } from '@angular/forms';
import { MatTooltip } from '@angular/material/tooltip';
import { ModListService } from '../../core/services/mod-list.service';
import { UserSettingsService } from '../../core/services/user-settings.service';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { MatListItemMeta } from '@angular/material/list';
import { ModUpdateService } from './mod-update.service';
import { ConfigurationService } from '../../core/services/configuration.service';
import { closest } from 'fastest-levenshtein';
import { IndexedMods } from '../../core/services/download.service';
import { NgArrayPipesModule } from 'ngx-pipes';
import { LevenshteinService } from '../../core/services/levenshtein.service';

@Component({
  standalone: true,
  selector: 'app-mod-update-overview',
  templateUrl: './mod-update-overview.component.html',
  styleUrl: './mod-update-overview.component.scss',
  imports: [MatSlideToggle, ReactiveFormsModule, MatTooltip, MatIcon, MatIconButton, MatListItemMeta, NgArrayPipesModule],
  providers: [ModUpdateService],
})
export default class ModUpdateOverviewComponent {
  #electronService = inject(ElectronService);
  #levenshteinService = inject(LevenshteinService);
  #userSettingsService = inject(UserSettingsService);
  #modListService = inject(ModListService);
  #configurationService = inject(ConfigurationService);
  #modUpdateService = inject(ModUpdateService);

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
      // const modMetaData = this.#configurationService.configSignal()?.modMetaData!;
      const config = this.#configurationService.configSignal();

      if (!activeInstance || !config) {
        return;
      }

      this.#modUpdateService.assignAlternativeNames(activeInstance.serverMods, config.alternativeModNames);
      this.#modUpdateService.assignAlternativeNames(activeInstance.clientMods, config.alternativeModNames);

      // const flattenMetaModNames = this.#levenshteinService.flattenSubMods(modMetaData.map(m => ({ name: m.name }) as ModMeta));
      const flattenIndexedModNames = this.#levenshteinService.flattenSubMods(indexedMods.map(m => ({ name: m.name }) as ModMeta));
      const combinedModNames = [...flattenIndexedModNames]; //...flattenMetaModNames,

      activeInstance.serverMods.forEach(mod => this.handleMod(mod, indexedMods, combinedModNames)); //, modMetaData
      activeInstance.clientMods.forEach(mod => this.handleMod(mod, indexedMods, combinedModNames)); //, modMetaData
    });
  }

  private handleMod(
    mod: ModMeta,
    indexedMods: IndexedMods[],
    // modMetaData: {
    //   name: string;
    //   hubId: string;
    // }[],
    flattenModNames: string[]
  ) {
    const indexedModAlternativeName = indexedMods.find(m => m.name === mod.alternativeName);
    const indexedModModName = indexedMods.find(m => m.name === mod.name);

    if (!!indexedModAlternativeName || !!indexedModModName) {
      mod.hubId = indexedModAlternativeName?.id ?? indexedModModName?.id;

      mod.subMods?.forEach(subMod => {
        this.handleMod(subMod, indexedMods, flattenModNames); //, modMetaData
        if (subMod.hubId && !mod.hubId) {
          mod.hubId = subMod.hubId;
        }
      });

      return;
    }

    const closestAlternativeName = closest(mod.alternativeName ?? '', flattenModNames);
    const closestModName = closest(mod.name, flattenModNames);

    const isHubNameBasedOnLevenshtein = closestAlternativeName
      ? this.#levenshteinService.isMatchBasedOnLevenshtein(closestAlternativeName, mod.alternativeName)
      : false;
    const isModNameBasedOnLLevenshtein = closestModName ? this.#levenshteinService.isMatchBasedOnLevenshtein(closestModName, mod.name) : false;

    if (isHubNameBasedOnLevenshtein) {
      const item = indexedMods?.find(m => m.name === closestAlternativeName);
      mod.hubId = item?.id;
      mod.subMods?.forEach(subMod => {
        this.handleMod(subMod, indexedMods, flattenModNames); //, modMetaData
        if (subMod.hubId && !mod.hubId) {
          mod.hubId = subMod.hubId;
        }
      });
      return;
    }

    if (isModNameBasedOnLLevenshtein) {
      const item = indexedMods?.find(m => m.name === closestModName);
      mod.hubId = item?.id;
      mod.subMods?.forEach(subMod => {
        this.handleMod(subMod, indexedMods, flattenModNames); //, modMetaData
        if (subMod.hubId && !mod.hubId) {
          mod.hubId = subMod.hubId;
        }
      });
      return;
    }

    //const closestAlternativeName = closest(mod.alternativeName ?? '', flattenModNames);
    //const closestModName = closest(mod.name, flattenModNames);
    //
    //const isHubNameBasedOnLevenshtein = closestAlternativeName
    //  ? this.#levenshteinService.isMatchBasedOnLevenshtein(closestAlternativeName, mod.alternativeName)
    //  : false;
    //
    //const isModNameBasedOnLLevenshtein = closestModName ? this.#levenshteinService.isMatchBasedOnLevenshtein(closestModName, mod.name) : false;
    //
    //if (isHubNameBasedOnLevenshtein) {
    //  const item = modMetaData?.find(m => m.name === closestAlternativeName);
    //  mod.hubId = item?.hubId;
    //
    //  mod.subMods?.forEach(subMod => {
    //    this.handleMod(subMod, indexedMods, flattenModNames); //, modMetaData
    //    if (subMod.hubId && !mod.hubId) {
    //      mod.hubId = subMod.hubId;
    //    }
    //  });
    //
    //  return;
    //}
    //
    //if (isModNameBasedOnLLevenshtein) {
    //  const item = modMetaData?.find(m => m.name === closestModName);
    //  mod.hubId = item?.hubId;
    //
    //  mod.subMods?.forEach(subMod => {
    //    this.handleMod(subMod, indexedMods, modMetaData, flattenModNames);
    //    if (subMod.hubId && !mod.hubId) {
    //      mod.hubId = subMod.hubId;
    //    }
    //  });
    //
    //  return;
    //}
    //
    mod.subMods?.forEach(subMod => {
      this.handleMod(subMod, indexedMods, flattenModNames); //, modMetaData
      if (subMod.hubId && !mod.hubId) {
        mod.hubId = subMod.hubId;
      }

      return;
    });
  }

  openExternal(modPath: string) {
    this.#electronService.openPath(modPath);
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

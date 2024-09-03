import { Component, computed, effect, inject } from '@angular/core';
import { ElectronService } from '../../core/services/electron.service';
import { ModMeta, UpdateModMeta } from '../../../../shared/models/user-setting.model';
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
import { MatCardModule } from '@angular/material/card';
import { clean, gte } from 'semver';

@Component({
  standalone: true,
  selector: 'app-mod-update-overview',
  templateUrl: './mod-update-overview.component.html',
  styleUrl: './mod-update-overview.component.scss',
  imports: [MatCardModule, MatSlideToggle, ReactiveFormsModule, MatTooltip, MatIcon, MatIconButton, MatListItemMeta, NgArrayPipesModule],
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
    return [...activeInstance.serverMods, ...activeInstance.clientMods] as UpdateModMeta[];
  });

  constructor() {
    effect(() => {
      const activeInstance = this.#userSettingsService.userSettingSignal().find(i => i.isActive);
      const indexedMods = this.#modListService.indexedModListSignal();
      const config = this.#configurationService.configSignal();

      if (!activeInstance || !config) {
        return;
      }

      this.#modUpdateService.assignAlternativeNames(activeInstance.serverMods, config.alternativeModNames);
      this.#modUpdateService.assignAlternativeNames(activeInstance.clientMods, config.alternativeModNames);

      const flattenIndexedModNames = this.#levenshteinService.flattenSubMods(indexedMods.map(m => ({ name: m.name }) as ModMeta));
      const combinedModNames = [...flattenIndexedModNames];

      activeInstance.serverMods.forEach(mod => this.handleMod(mod, indexedMods, combinedModNames));
      activeInstance.clientMods.forEach(mod => this.handleMod(mod, indexedMods, combinedModNames));
    });
  }

  private handleMod(mod: UpdateModMeta, indexedMods: IndexedMods[], flattenModNames: string[]) {
    const indexedModAlternativeName = indexedMods.find(m => m.name === mod.alternativeName);
    const indexedModModName = indexedMods.find(m => m.name === mod.name);

    mod.version = mod.version;

    if (!!indexedModAlternativeName || !!indexedModModName) {
      const newVersion = indexedModAlternativeName?.version ?? indexedModModName?.version;

      if (!this.areVersionsEqual(mod.version, newVersion)) {
        mod.hubId = indexedModAlternativeName?.id ?? indexedModModName?.id;
        mod.updateVersion = newVersion;
        mod.isUpdateAvailable = true;
      }

      this.processSubMods(mod, indexedMods, flattenModNames, newVersion);
      return;
    }

    const closestAlternativeName = closest(mod.alternativeName ?? '', flattenModNames);
    const closestModName = closest(mod.name, flattenModNames);

    const isHubNameBasedOnLevenshtein = this.#levenshteinService.isMatchBasedOnLevenshtein(closestAlternativeName, mod.alternativeName);
    const isModNameBasedOnLevenshtein = this.#levenshteinService.isMatchBasedOnLevenshtein(closestModName, mod.name);

    if (isHubNameBasedOnLevenshtein) {
      this.updateModDetails(mod, indexedMods, flattenModNames, closestAlternativeName);
      return;
    }

    if (isModNameBasedOnLevenshtein) {
      this.updateModDetails(mod, indexedMods, flattenModNames, closestModName);
      return;
    }
  }

  private processSubMods(mod: UpdateModMeta, indexedMods: IndexedMods[], flattenModNames: string[], updateVersion: string | undefined) {
    mod.subMods?.forEach(subMod => {
      this.handleMod(subMod, indexedMods, flattenModNames);

      if (subMod.hubId && !mod.hubId && !this.areVersionsEqual(mod.version, updateVersion)) {
        mod.hubId = subMod.hubId;
        mod.updateVersion = updateVersion;
        mod.isUpdateAvailable = true;
      }
    });
  }

  private updateModDetails(mod: UpdateModMeta, indexedMods: IndexedMods[], flattenModNames: string[], closestName: string) {
    const item = indexedMods?.find(m => m.name === closestName);

    if (!this.areVersionsEqual(mod.version, item?.version)) {
      mod.hubId = item?.id;
      mod.updateVersion = item?.version;
      mod.isUpdateAvailable = true;
    }

    this.processSubMods(mod, indexedMods, flattenModNames, item?.version);
  }

  private trimTrailingZeros(version: string): string {
    const parts = version.split('.');
    if (parts.length === 4 && parts[3] === '0') {
      parts.pop();
    }
    return parts.join('.');
  }

  private areVersionsEqual(version1: string | undefined, version2: string | undefined): boolean {
    if (!version1 || !version2) return false;

    const cleanedVersion1 = this.trimTrailingZeros(version1);
    const cleanedVersion2 = this.trimTrailingZeros(version2);

    return gte(cleanedVersion1, cleanedVersion2);
  }
}

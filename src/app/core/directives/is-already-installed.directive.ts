import { computed, Directive, inject, Input } from '@angular/core';
import { UserSettingsService } from '../services/user-settings.service';
import { closest, distance } from 'fastest-levenshtein';
import { Mod } from '../models/mod';
import { ModListService } from '../services/mod-list.service';
import { Configuration, ConfigurationService } from '../services/configuration.service';
import { ModMeta } from '../../../../shared/models/user-setting.model';
import alternativeModNames from './backupAlternativeNames.json';
import { LevenshteinService } from '../services/levenshtein.service';

@Directive({
  standalone: true,
  selector: '[appIsAlreadyInstalled]',
  exportAs: 'isAlreadyInstalled',
})
export class IsAlreadyInstalledDirective {
  #userSettingsService = inject(UserSettingsService);
  #configurationService = inject(ConfigurationService);
  #modListService = inject(ModListService);
  #levenshteinService = inject(LevenshteinService);

  @Input({ required: true }) mod!: Mod;

  isAlreadyInstalled = computed(() => this.checkModAlreadyInstalled());
  isInModList = computed(() => this.checkModInModList());

  private checkModAlreadyInstalled() {
    const modName = this.mod.name;
    let config = this.#configurationService.configSignal();
    const activeInstance = this.#userSettingsService.getActiveInstance();
    if (!this.mod || !modName || !activeInstance || (!activeInstance?.serverMods?.length && !activeInstance?.clientMods?.length)) {
      return false;
    }

    if (!activeInstance) {
      return false;
    }

    if (!config) {
      config = { alternativeModNames: alternativeModNames.alternativeModNames } as unknown as Configuration;
    }

    this.assignAlternativeNames(activeInstance.serverMods, config.alternativeModNames);
    this.assignAlternativeNames(activeInstance.clientMods, config.alternativeModNames);

    const closestServerModName = closest(modName, this.#levenshteinService.flattenSubMods(activeInstance.serverMods));
    const closestClientModName = closest(modName, this.#levenshteinService.flattenSubMods(activeInstance.clientMods));

    return (
      this.#levenshteinService.isMatchBasedOnLevenshtein(modName, closestServerModName) ||
      this.#levenshteinService.isMatchBasedOnLevenshtein(modName, closestClientModName)
    );
  }

  private checkModInModList() {
    return this.#modListService.modListSignal().some(m => m.name === this.mod.name);
  }

  private assignAlternativeNames(mods: ModMeta[], alternativeNames: { [key: string]: string }) {
    for (const mod of mods) {
      if (Object.prototype.hasOwnProperty.call(alternativeNames, mod.name.trim())) {
        mod.alternativeName = alternativeNames[mod.name.trim()];
      }

      if (mod.subMods) {
        this.assignAlternativeNames(mod.subMods, alternativeNames); // Recursive call for subMods
      }
    }
  }
}

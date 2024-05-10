import { computed, Directive, inject, Input } from '@angular/core';
import { UserSettingsService } from '../services/user-settings.service';
import { closest, distance } from 'fastest-levenshtein';
import { Mod } from '../models/mod';
import { ModListService } from '../services/mod-list.service';
import { Configuration, ConfigurationService } from '../services/configuration.service';
import { ModMeta } from '../../../../shared/models/user-setting.model';
import alternativeModNames from './backupAlternativeNames.json';

@Directive({
  standalone: true,
  selector: '[appIsAlreadyInstalled]',
  exportAs: 'isAlreadyInstalled',
})
export class IsAlreadyInstalledDirective {
  #userSettingsService = inject(UserSettingsService);
  #configurationService = inject(ConfigurationService);
  #modListService = inject(ModListService);

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
      config = { alternativeModNames: alternativeModNames } as unknown as Configuration;
    }

    this.assignAlternativeNames(activeInstance.serverMods, config.alternativeModNames);
    this.assignAlternativeNames(activeInstance.clientMods, config.alternativeModNames);

    const closestServerModName = closest(modName, this.flattenSubMods(activeInstance.serverMods));
    const closestClientModName = closest(modName, this.flattenSubMods(activeInstance.clientMods));

    return this.isMatchBasedOnLevenshtein(modName, closestServerModName) || this.isMatchBasedOnLevenshtein(modName, closestClientModName);
  }

  private flattenSubMods(mods: ModMeta[]): string[] {
    return mods.flatMap(mod => [
      ...(mod.name ? [mod.name] : []),
      ...(mod.alternativeName ? [mod.alternativeName] : []),
      ...this.flattenSubMods(mod.subMods ?? []),
    ]);
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

  private checkModInModList() {
    return this.#modListService.modListSignal().some(m => m.name === this.mod.name);
  }

  private assignAlternativeNames(mods: ModMeta[], alternativeNames: { [key: string]: string }) {
    for (const mod of mods) {
      if (Object.prototype.hasOwnProperty.call(alternativeNames, mod.name)) {
        mod.alternativeName = alternativeNames[mod.name];
      }

      if (mod.subMods) {
        this.assignAlternativeNames(mod.subMods, alternativeNames); // Recursive call for subMods
      }
    }
  }
}

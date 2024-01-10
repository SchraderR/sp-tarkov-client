import { computed, Directive, inject, Input } from '@angular/core';
import { UserSettingsService } from '../services/user-settings.service';
import { closest, distance } from 'fastest-levenshtein';
import { Mod } from '../models/mod';
import { ModListService } from '../services/mod-list.service';

@Directive({
  standalone: true,
  selector: '[appIsAlreadyInstalled]',
  exportAs: 'isAlreadyInstalled',
})
export class IsAlreadyInstalledDirective {
  #userSettingsService = inject(UserSettingsService);
  #modListService = inject(ModListService);

  @Input({ required: true }) mod!: Mod;

  isAlreadyInstalled = computed(() => this.checkModAlreadyInstalled());
  isInModList = computed(() => this.checkModInModList());

  private checkModAlreadyInstalled() {
    const modName = this.mod.name;
    const activeInstance = this.#userSettingsService.getActiveInstance();
    if (!this.mod || !modName || !activeInstance || (!activeInstance?.serverMods?.length && !activeInstance?.clientMods?.length)) {
      return false;
    }

    if (!activeInstance) {
      return false;
    }

    const closestServerModName = closest(
      modName,
      activeInstance.serverMods.map(m => m.name)
    );
    const closestClientModName = closest(
      modName,
      activeInstance.clientMods.map(m => m.name)
    );

    return this.isMatchBasedOnLevenshtein(modName, closestServerModName) || this.isMatchBasedOnLevenshtein(modName, closestClientModName);
  }

  private isMatchBasedOnLevenshtein(stringA = '', stringB = '', threshold = 0.2): boolean {
    const levenshteinDistance = distance(stringA, stringB);
    const averageLength = (stringA.length + stringB.length) / 2;

    const relativeDistance = levenshteinDistance / averageLength;
    return relativeDistance <= threshold;
  }

  private checkModInModList() {
    return this.#modListService.modListSignal().some(m => m.name === this.mod.name);
  }
}

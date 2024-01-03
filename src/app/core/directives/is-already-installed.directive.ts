import { Directive, effect, inject, Input } from '@angular/core';
import { UserSettingsService } from '../services/user-settings.service';
import { closest, distance } from 'fastest-levenshtein';
import { AkiInstance } from '../../../../shared/models/user-setting.model';

@Directive({
  standalone: true,
  selector: '[isAlreadyInstalled]',
  exportAs: 'isAlreadyInstalled',
})
export class IsAlreadyInstalledDirective {
  #userSettingsService = inject(UserSettingsService);

  @Input({ required: true }) modName!: string;
  isInstalledMod = false;

  constructor() {
    effect(() => {
      const activeInstance = this.#userSettingsService.getActiveInstance();
      if (!this.modName || !activeInstance || (!activeInstance.serverMods?.length && !activeInstance.clientMods?.length)) {
        return false;
      }

      this.checkModAlreadyInstalled(this.modName, activeInstance);
    });
  }

  private checkModAlreadyInstalled(modName: string, activeInstance: AkiInstance) {
    const closestServerModName = closest(modName, activeInstance.serverMods.map(m => m.name));
    const closestClientModName = closest(modName, activeInstance.clientMods.map(m => m.name));

    this.isInstalledMod = this.isMatchBasedOnLevenshtein(modName, closestServerModName) || this.isMatchBasedOnLevenshtein(modName, closestClientModName);
  }

  private isMatchBasedOnLevenshtein(stringA: string, stringB: string, threshold = 0.2): boolean {
    const levenshteinDistance = distance(stringA, stringB);
    const averageLength = (stringA.length + stringB.length) / 2;

    const relativeDistance = levenshteinDistance / averageLength;
    return relativeDistance <= threshold;
  }
}

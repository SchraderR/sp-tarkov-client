import { Directive, inject, Input } from '@angular/core';
import { UserSettingsService } from '../services/user-settings.service';
import { closest, distance } from 'fastest-levenshtein';

@Directive({
  standalone: true,
  selector: '[isAlreadyInstalled]',
  exportAs: 'isAlreadyInstalled',
})
export class IsAlreadyInstalledDirective {
  #userSettingsService = inject(UserSettingsService);
  isInstalledMod = false;

  @Input({ required: true }) set appIsAlreadyInstalled(modName: string) {
    const activeInstance = this.#userSettingsService.getActiveInstance();

    const closestServerModName = closest(modName, activeInstance!.serverMods!.map(m => m.name));
    const closestClientModName = closest(modName, activeInstance!.clientMods!.map(m => m.name));

    this.isInstalledMod = this.isMatchBasedOnLevenshtein(modName, closestServerModName) ||  this.isMatchBasedOnLevenshtein(modName, closestClientModName);
  }

  private isMatchBasedOnLevenshtein(stringA: string, stringB: string, threshold = 0.2): boolean {
    const levenshteinDistance = distance(stringA, stringB);
    const averageLength = (stringA.length + stringB.length) / 2;

    const relativeDistance = levenshteinDistance / averageLength;
    return relativeDistance <= threshold;
  }
}



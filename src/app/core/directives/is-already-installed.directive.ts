import { computed, Directive, inject, Input } from '@angular/core';
import { UserSettingsService } from '../services/user-settings.service';
import { closest, distance } from 'fastest-levenshtein';
import { Mod } from '../models/mod';
import { ModListService } from '../services/mod-list.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';

@Directive({
  standalone: true,
  selector: '[appIsAlreadyInstalled]',
  exportAs: 'isAlreadyInstalled',
})
export class IsAlreadyInstalledDirective {
  #userSettingsService = inject(UserSettingsService);
  #modListService = inject(ModListService);
  #httpClient = inject(HttpClient);

  @Input({ required: true }) mod!: Mod;

  isAlreadyInstalled = computed(() => this.checkModAlreadyInstalled());
  isInModList = computed(() => this.checkModInModList());

  private checkModAlreadyInstalled() {
    // TODO outsource in service -> use angular initialize and fetch configuration
    const config: any = this.#httpClient.get(`${environment.githubConfigLink}/config.json`);
    console.log(config);

    let alternativeServerModNames = config['alternativeServerModNames'];
    let alternativeClientModNames = config['alternativeClientModNames'];

    // console.log(alternativeClientModNames);

    const modName = this.mod.name;
    const activeInstance = this.#userSettingsService.getActiveInstance();
    if (!this.mod || !modName || !activeInstance || (!activeInstance?.serverMods?.length && !activeInstance?.clientMods?.length)) {
      return false;
    }

    if (!activeInstance) {
      return false;
    }

    for (const serverMod of activeInstance.serverMods) {
      if (Object.prototype.hasOwnProperty.call(alternativeServerModNames, serverMod.name)) {
        serverMod.alternativeName = alternativeServerModNames[serverMod.name] as string;
      }
    }

    for (const clientMod of activeInstance.clientMods) {
      if (Object.prototype.hasOwnProperty.call(alternativeClientModNames, clientMod.name)) {
        clientMod.alternativeName = alternativeClientModNames[clientMod.name];
      }
    }

    const closestServerModName = closest(
      modName,
      activeInstance.serverMods.flatMap(m => [m.name, m.alternativeName ?? ''])
    );
    const closestClientModName = closest(
      modName,
      activeInstance.clientMods.flatMap(m => [m.name, m.alternativeName ?? ''])
    );

    return this.isMatchBasedOnLevenshtein(modName, closestServerModName) || this.isMatchBasedOnLevenshtein(modName, closestClientModName);
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
}

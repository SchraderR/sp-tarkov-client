import { computed, Directive, inject, Input } from '@angular/core';
import { UserSettingsService } from '../services/user-settings.service';
import { closest, distance } from 'fastest-levenshtein';
import { Mod } from '../models/mod';
import { ModListService } from '../services/mod-list.service';
import { Configuration, ConfigurationService } from '../services/configuration.service';
import { ModMeta } from '../../../../shared/models/user-setting.model';

@Directive({
  standalone: true,
  selector: '[appIsAlreadyInstalled]',
  exportAs: 'isAlreadyInstalled',
})
export class IsAlreadyInstalledDirective {
  private backupServerModNames: { [key: string]: string } = {
    SVM: 'Server Value Modifier [SVM]',
    SAIN: 'SAIN 2.0 - Solarint"s AI Modifications - Full AI Combat System Replacement',
    'SWAG + DONUTS': 'SWAG + Donuts - Dynamic Spawn Waves and Custom Spawn Points',
    LPARedux: 'Lock Picking Attorney Redux',
    NLE: 'Never Lose Equipments',
    RPG7: 'RPG-7',
    'AR-54': 'AR-54 7.62x54mmR Designated Marksman Rifle (DMR)',
    'Tactical Gear Component (TGC)': 'Tactical Gear Component',
    lotus: 'Lotus Trader',
    'Fox-PineappleBlitz': 'Fox - PINEAPPLE BLITZ GRENADE (RE-UPLOAD)',
    'Skills Extended': '[BETA] Skills Extended',
    Weapons: "Epic's Weapon Pack",
    Priscilu: 'Priscilu: the trader',
    AmmoStats: 'Ammo Stats in Description',
  };

  private backupClientModNames: { [key: string]: string } = {
    SVM: 'Server Value Modifier [SVM]',
    SAIN: 'SAIN 2.0 - Solarint"s AI Modifications - Full AI Combat System Replacement',
    'DrakiaXYZ-BigBrain': 'BigBrain',
    'skwizzy.LootingBots': 'Looting Bots',
    'dvize.BushNoESP': 'No Bush ESP',
    'DrakiaXYZ-Waypoints': 'Waypoints - Expanded Navmesh',
    FOVFix: "Fontaine's FOV Fix & Variable Optics",
    'SamSWAT.FOV': "SamSwat's INCREASED FOV - Reupload",
    'IcyClawz.ItemSellPrice': 'Item Sell Price',
    'CactusPie.FastHealing': 'Fast healing',
    GamePanelHUDCompass: 'Game Panel HUD',
    'CactusPie.MapLocation.Common': "CactusPie's Minimap",
    SkillsExtended: '[BETA] Skills Extended',
    BetterFolderBrowser: 'Minimalist Launcher',
    SPTQuestingBots: 'Questing Bots',
  };

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
      config = { alternativeClientModNames: this.backupClientModNames, alternativeServerModNames: this.backupServerModNames } as Configuration;
    }

    for (const serverMod of activeInstance.serverMods) {
      if (Object.prototype.hasOwnProperty.call(config.alternativeServerModNames, serverMod.name)) {
        serverMod.alternativeName = config.alternativeServerModNames[serverMod.name] as string;
      }
    }

    for (const clientMod of activeInstance.clientMods) {
      if (Object.prototype.hasOwnProperty.call(config.alternativeClientModNames, clientMod.name)) {
        clientMod.alternativeName = config.alternativeClientModNames[clientMod.name];
      }
    }

    const closestServerModName = closest(modName, this.flattenSubMods(activeInstance.serverMods));
    const closestClientModName = closest(modName, this.flattenSubMods(activeInstance.clientMods));

    return this.isMatchBasedOnLevenshtein(modName, closestServerModName) || this.isMatchBasedOnLevenshtein(modName, closestClientModName);
  }

  private flattenSubMods(mods: ModMeta[]): any[] {
    return mods.flatMap(mod => [mod.name, mod.alternativeName ?? '', ...this.flattenSubMods(mod.subMods ?? [])]);
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

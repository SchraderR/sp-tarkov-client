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
  private alternativeServerModNames: { [key: string]: string } = {
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

  private alternativeClientModNames: { [key: string]: string } = {
    SVM: 'Server Value Modifier [SVM]',
    SAIN: 'SAIN 2.0 - Solarint"s AI Modifications - Full AI Combat System Replacement',
    'DrakiaXYZ-BigBrain': 'BigBrain',
    'skwizzy.LootingBots': 'Looting Bots',
    'dvize.BushNoESP': 'No Bush ESP',
    'DrakiaXYZ-Waypoints': 'Waypoints - Expanded Bot Patrols and Navmesh',
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
  #modListService = inject(ModListService);
  // #httpClient = inject(HttpClient);

  @Input({ required: true }) mod!: Mod;

  isAlreadyInstalled = computed(() => this.checkModAlreadyInstalled());
  isInModList = computed(() => this.checkModInModList());

  private checkModAlreadyInstalled() {
    // TODO outsource in service -> use angular initialize and fetch configuration
    // const config: any = this.#httpClient.get(`${environment.githubConfigLink}/config.json`);
    // console.log(config);
    //
    // let alternativeServerModNames = config['alternativeServerModNames'];
    // let alternativeClientModNames = config['alternativeClientModNames'];

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
      if (Object.prototype.hasOwnProperty.call(this.alternativeServerModNames, serverMod.name)) {
        serverMod.alternativeName = this.alternativeServerModNames[serverMod.name] as string;
      }
    }

    for (const clientMod of activeInstance.clientMods) {
      if (Object.prototype.hasOwnProperty.call(this.alternativeClientModNames, clientMod.name)) {
        clientMod.alternativeName = this.alternativeClientModNames[clientMod.name];
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

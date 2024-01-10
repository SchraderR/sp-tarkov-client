import { Injectable, signal } from '@angular/core';
import { InstallProgress, Mod } from '../models/mod';

@Injectable({
  providedIn: 'root',
})
export class ModListService {
  private mockModList: Mod[] = [
    {
      name: "Amands's Graphics",
      fileUrl: 'https://hub.sp-tarkov.com/files/file/813-amands-s-graphics/',
      image: 'https://hub.sp-tarkov.com/files/images/file/f4/813.png',
      teaser: 'Lighting and postprocessing overhaul',
      kind: '',
      installProgress: this.initialInstallProgress(),
    },
    {
      name: 'MoreCheckmarks',
      fileUrl: 'https://hub.sp-tarkov.com/files/file/1159-morecheckmarks/',
      image: 'https://hub.sp-tarkov.com/files/images/file/c5/1159.png',
      teaser:
        'A mod that adds checkmarks and more detailed tooltips to items to indicate if it is needed for hideout upgrades, quests, or if it is on your wishlist',
      kind: '',
      installProgress: this.initialInstallProgress(),
    },
    {
      name: 'Waypoints - Expanded Bot Patrols and Navmesh',
      fileUrl: 'https://hub.sp-tarkov.com/files/file/1119-waypoints-expanded-bot-patrols-and-navmesh/',
      image: 'https://hub.sp-tarkov.com/files/images/file/5b/1119.png',
      teaser: 'Expand where bots can explore with new patrols and full map navmesh coverage!',
      kind: '',
      installProgress: this.initialInstallProgress(),
    },
    {
      name: 'Looting Bots',
      fileUrl: 'https://hub.sp-tarkov.com/files/file/1096-looting-bots/',
      icon: ' fa-shopping-bag',
      teaser:
        'This mod aims to add more life to the bots by enhancing some EFT looting behaviors letting bots loot items, containers, and corpses during patrols. More features to come!',
      kind: '',
      installProgress: this.initialInstallProgress(),
    },
    {
      name: 'No Bush ESP',
      fileUrl: 'https://hub.sp-tarkov.com/files/file/903-no-bush-esp/',
      icon: ' fa-eye-slash',
      teaser: 'Tired of AI Looking at your bush and destroying you through it?  Now they no longer can.',
      kind: '',
      installProgress: this.initialInstallProgress(),
    },
    {
      name: "Amands's Hitmarker",
      fileUrl: 'https://hub.sp-tarkov.com/files/file/798-amands-s-hitmarker/',
      image: 'https://hub.sp-tarkov.com/files/images/file/a9/798.png',
      teaser: 'Hitmarkers with different Shapes, Colors and Sounds',
      kind: '',
      installProgress: this.initialInstallProgress(),
    },
    {
      name: 'BigBrain',
      fileUrl: 'https://hub.sp-tarkov.com/files/file/1219-bigbrain/',
      icon: ' fa-file-o',
      teaser: 'A library for adding extra logic layers to existing bot brains',
      kind: '',
      installProgress: this.initialInstallProgress(),
    },
    {
      name: 'SPT Realism Mod',
      fileUrl: 'https://hub.sp-tarkov.com/files/file/606-spt-realism-mod/',
      image: 'https://hub.sp-tarkov.com/files/images/file/24/606.png',
      teaser: 'Realistic Overhaul of SPT designed around making the game experience as realistic and hardcore as possible. Highly configurable!',
      kind: '',
      installProgress: this.initialInstallProgress(),
    },
    {
      name: 'Game Panel HUD',
      fileUrl: 'https://hub.sp-tarkov.com/files/file/652-game-panel-hud/',
      image: 'https://hub.sp-tarkov.com/files/images/file/45/652.png',
      teaser: 'Tarkov All-in-one HUD Expansion',
      kind: '',
      installProgress: this.initialInstallProgress(),
    },
  ];

  private modList = signal<Mod[]>(this.mockModList);
  readonly modListSignal = this.modList.asReadonly();

  addMod(mod: Mod) {
    if (this.modList().some(m => m.name === mod.name)) {
      return;
    }

    this.modList.update(modItems => [...modItems, { ...mod, installProgress: this.initialInstallProgress() }]);
  }

  updateMod() {
    this.modList.update(state => [...state]);
  }

  removeMod(name: string) {
    this.modList.update(() => [...this.modList().filter(m => m.name !== name)]);
  }

  clearModList() {
    this.modList.set([]);
  }

  private initialInstallProgress(): InstallProgress {
    return {
      completed: false,
      linkStep: {
        start: false,
        error: false,
        progress: 0,
      },
      downloadStep: {
        start: false,
        error: false,
        percent: 0,
        totalBytes: '',
        transferredBytes: '',
      },
      unzipStep: {
        start: false,
        error: false,
        progress: 0,
      },
    };
  }
}

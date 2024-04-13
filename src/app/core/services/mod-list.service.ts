import { Injectable, signal } from '@angular/core';
import { InstallProgress, Mod } from '../models/mod';
import { Kind } from '../../../../shared/models/unzip.model';

@Injectable({
  providedIn: 'root',
})
export class ModListService {
  private modList = signal<Mod[]>([
    {
      name: "Amands's Graphics",
      fileUrl: 'https://hub.sp-tarkov.com/files/file/813-amands-s-graphics/',
      image: 'https://hub.sp-tarkov.com/files/images/file/61/813.png',
      teaser: '\n\t\t\t\t\t\tLighting and postprocessing overhaul\t\t\t\t\t',
      supportedAkiVersion: 'SPT-AKI 3.8.0',
      akiVersionColorCode: 'badge label green',
      kind: undefined,
      installProgress: this.initialInstallProgress(),
    },
    {
      name: 'LootValue',
      image: 'https://hub.sp-tarkov.com/files/images/file/d8/1606.png',
      fileUrl: 'https://hub.sp-tarkov.com/files/file/1606-lootvalue/',
      kind: undefined,
      installProgress: this.initialInstallProgress(),
    },
  ]);
  readonly modListSignal = this.modList.asReadonly();

  addMod(mod: Mod) {
    if (this.modList().some(m => m.name === mod.name)) {
      return;
    }

    this.modList.update(modItems => [...modItems, { ...mod, installProgress: this.initialInstallProgress() }]);
    console.log(this.modList());
  }

  updateMod() {
    this.modList.update(state => [...state]);
  }

  removeMod(name: string) {
    this.modList.update(() => [...this.modList().filter(m => m.name !== name)]);
  }

  removeCompletedMods() {
    this.modList.update(() => [...this.modList().filter(m => !m.installProgress?.completed)]);
  }

  initialInstallProgress(): InstallProgress {
    return {
      completed: false,
      error: false,
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

  clearFakeTutorialMods() {
    this.modList.set([]);
  }

  addFakeModForTutorial() {
    this.modList.set([
      {
        name: "Amands's Graphics",
        fileUrl: null!,
        image: 'assets/images/813.png',
        teaser: 'Lighting and postprocessing overhaul',
        supportedAkiVersion: 'Empfohlen',
        kind: undefined,
        akiVersionColorCode: 'badge label green jsLabelFeatured',
        installProgress: null!,
      },
      {
        name: "SAIN 2.0 - Solarint's AI Modifications - Full AI Combat System Replacement",
        fileUrl: null!,
        image: 'assets/images/1062.jpg',
        teaser: "Bots that don't suck.",
        supportedAkiVersion: 'Empfohlen',
        kind: undefined,
        akiVersionColorCode: 'badge label green jsLabelFeatured',
        installProgress: null!,
      },
      {
        name: 'SPT Realism Mod',
        fileUrl: null!,
        image: 'assets/images/606.png',
        teaser: 'Realistic Overhaul of SPT designed around making the game experience as realistic and hardcore as possible. Highly configurable!',
        supportedAkiVersion: 'Empfohlen',
        kind: undefined,
        akiVersionColorCode: 'badge label green jsLabelFeatured',
        installProgress: null!,
      },
    ]);
  }
}

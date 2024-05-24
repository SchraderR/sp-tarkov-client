import { Injectable, signal } from '@angular/core';
import { InstallProgress, Mod } from '../models/mod';

@Injectable({
  providedIn: 'root',
})
export class ModListService {
  private modList = signal<Mod[]>([]);
  private useIndexedMods = signal<boolean>(false);
  readonly modListSignal = this.modList.asReadonly();
  readonly useIndexedModsSignal = this.useIndexedMods.asReadonly();

  setUseIndexedMods(value: boolean) {
    this.useIndexedMods.set(value);
  }

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
        supportedAkiVersion: 'SPT-AKI 5.0.0',
        kind: undefined,
        notSupported: false,
        akiVersionColorCode: 'badge label green jsLabelFeatured',
        installProgress: null!,
      },
      {
        name: "SAIN 2.0 - Solarint's AI Modifications - Full AI Combat System Replacement",
        fileUrl: null!,
        image: 'assets/images/1062.jpg',
        teaser: "Bots that don't suck.",
        supportedAkiVersion: 'SPT-AKI 5.0.0',
        kind: undefined,
        notSupported: false,
        akiVersionColorCode: 'badge label green jsLabelFeatured',
        installProgress: null!,
      },
      {
        name: 'SPT Realism Mod',
        fileUrl: null!,
        image: 'assets/images/606.png',
        teaser: 'Realistic Overhaul of SPT designed around making the game experience as realistic and hardcore as possible. Highly configurable!',
        supportedAkiVersion: 'SPT-AKI 5.0.0',
        kind: undefined,
        notSupported: false,
        akiVersionColorCode: 'badge label green jsLabelFeatured',
        installProgress: null!,
      },
    ]);
  }
}

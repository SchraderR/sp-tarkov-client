import { Injectable, signal } from '@angular/core';
import { InstallProgress, Mod } from '../models/mod';
import { writeFile, promises as fsPromises } from 'fs';

@Injectable({
  providedIn: 'root',
})
export class ModListService {
  private modList = signal<Mod[]>([]);
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

  saveInstalledModsToFile() {
    const modListWithoutProgress = this.modList().map(mod => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { installProgress, ...rest } = mod;
      return rest;
    });
    const filePath = 'installedMods.json';
    writeFile(filePath, JSON.stringify(modListWithoutProgress, null, 2), (err) => {
      if (err) {
        console.error('Error saving installed mods:', err);
      } else {

        console.log('Installed mods saved to', filePath);
      }
    });
  }

  async loadInstalledMods() {
    const filePath = 'installedMods.json';
    try {
      const data = await fsPromises.readFile(filePath, { encoding: 'utf8' });
      const mods: Mod[] = JSON.parse(data);
      this.modList.set(mods);
      console.log('Installed mods loaded from', filePath);
    } catch (err) {
      console.error('Error loading installed mods:', err);
    }
  }

  getInstalledMods(): Mod[] {
    return this.modList();
  }
}
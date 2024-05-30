import { inject, Injectable, signal } from '@angular/core';
import { InstallProgress, Mod } from '../models/mod';
import { IndexedMods } from './download.service';
import { catchError, firstValueFrom, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { ElectronService } from './electron.service';

@Injectable({
  providedIn: 'root',
})
export class ModListService {
  #electronService = inject(ElectronService);

  private modList = signal<Mod[]>([]);
  private indexedModList = signal<IndexedMods[]>([]);
  private useIndexedMods = signal<boolean>(false);

  readonly modListSignal = this.modList.asReadonly();
  readonly indexedModListSignal = this.indexedModList.asReadonly();
  readonly useIndexedModsSignal = this.useIndexedMods.asReadonly();

  #httpClient = inject(HttpClient);
  #MAX_CACHE_DURATION = 3600000; // 1 hour in milliseconds
  #lastFetchTime: Date | null = null;

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

  async getModData(): Promise<IndexedMods[]> {
    const currentTime = new Date();

    if (
      this.#lastFetchTime &&
      currentTime.getTime() - this.#lastFetchTime.getTime() < this.#MAX_CACHE_DURATION &&
      this.indexedModList() &&
      this.indexedModList().length > 0
    ) {
      console.log('Returning cached indexed mods');
      return this.indexedModList();
    }

    try {
      await firstValueFrom(this.loadIndexedMods());
      this.#lastFetchTime = new Date();
      return this.indexedModList();
    } catch (error) {
      console.error('Failed to fetch indexed mod data:', error);
      throw new Error('Failed to fetch indexed mod data');
    }
  }

  loadIndexedMods() {
    console.log('Fetching indexed mods data from hub json');
    return this.#httpClient
      .get<{ mod_data: IndexedMods[] }>(environment.akiHubModsJson)
      .pipe(tap(response => this.indexedModList.set(response.mod_data)));
  }

  loadUseIndexedModsSettings() {
    return this.#electronService.sendEvent<boolean>('use-indexed-mods').pipe(
      tap(response => this.setUseIndexedMods(response.args)),
      catchError(error => {
        console.error('Error fetching indexed mods usage:', error);
        return error;
      })
    );
  }
}

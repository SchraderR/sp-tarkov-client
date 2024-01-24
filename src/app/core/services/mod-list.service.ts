import { Injectable, signal } from '@angular/core';
import { InstallProgress, Mod } from '../models/mod';

@Injectable({
  providedIn: 'root',
})
export class ModListService {
  private modList = signal<Mod[]>([
    {
      name: 'Fast healing',
      fileUrl: 'https://hub.sp-tarkov.com/files/file/1723-fast-healing/',
      image: 'https://hub.sp-tarkov.com/files/images/file/06/1723.png',
      teaser: '\n\t\t\t\t\t\tFaster healing and surgery + dynamic healing time for less damaged body parts\t\t\t\t\t',
      supportedAkiVersion: 'SPT-AKI 3.7.6',
      akiVersionColorCode: 'badge label green',
      installProgress: this.initialInstallProgress(),
      kind: undefined,
    },
    {
      name: 'Stims Galore',
      fileUrl: 'https://hub.sp-tarkov.com/files/file/1725-stims-galore/',
      icon: ' fa-flask',
      teaser: '\n\t\t\t\t\t\tEasily create your stims in-game. Tool that comes pre-packed with some new and old stims.\t\t\t\t\t',
      supportedAkiVersion: 'SPT-AKI 3.7.6',
      akiVersionColorCode: 'badge label green',
      installProgress: this.initialInstallProgress(),
      kind: undefined,
    },
  ]);
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
}

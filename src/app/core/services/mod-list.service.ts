import { Injectable, signal } from '@angular/core';
import { InstallProgress, Mod } from '../models/mod';

@Injectable({
  providedIn: 'root',
})
export class ModListService {
  private modList = signal<Mod[]>([
    {
      name: "Amands's Graphics",
      fileUrl: 'https://hub.sp-tarkov.com/files/file/813-amands-s-graphics/',
      image: 'https://hub.sp-tarkov.com/files/images/file/f4/813.png',
      kind: '',
      installProgress: this.initialInstallProgress(),
    },
    {
      name: 'SPT Realism Mod',
      fileUrl: 'https://hub.sp-tarkov.com/files/file/606-spt-realism-mod/',
      image: 'https://hub.sp-tarkov.com/files/images/file/24/606.png',
      kind: '',
      installProgress: this.initialInstallProgress(),
    },
    {
      name: 'Tactical Gear Component',
      image: 'https://hub.sp-tarkov.com/files/images/file/08/1555.jpg',
      fileUrl: 'https://hub.sp-tarkov.com/files/file/1555-tactical-gear-component/',
      kind: 'Server mods, Equipment',
      installProgress: this.initialInstallProgress(),
    },
  ]);
  readonly modListSignal = this.modList.asReadonly();

  addMod(mod: Mod) {
    if (this.modList().some(m => m.name === mod.name)) {
      return;
    }

    this.modList.update(modItems => [...modItems, { ...mod, installProgress: this.initialInstallProgress() }]);
  }

  removeMod(name: string) {
    this.modList.update(() => [...this.modList().filter(m => m.name !== name)]);
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

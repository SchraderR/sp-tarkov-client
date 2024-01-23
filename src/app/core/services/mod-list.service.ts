import { Injectable, signal } from '@angular/core';
import { InstallProgress, Mod } from '../models/mod';
import { Kind } from '../../../../shared/models/unzip.model';

@Injectable({
  providedIn: 'root',
})
export class ModListService {
  private modList = signal<Mod[]>([
    {
      name: 'KMC Server Value Modifier (SVM)',
      fileUrl: 'https://hub.sp-tarkov.com/files/file/379-kmc-server-value-modifier-svm/',
      image: 'https://hub.sp-tarkov.com/files/images/file/a8/379.jpg',
      teaser: 'Standalone All-In-One Tool you ever need: Gives you the access for most game values and quality of life improvements, featuring easy-to-use GUI and ability to create presets',
      supportedAkiVersion: 'SPT-AKI 3.7.1',
      akiVersionColorCode: 'badge label slightly-outdated',
      kind: Kind.server,
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

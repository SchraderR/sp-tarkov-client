import { Injectable, signal } from '@angular/core';
import { Mod } from '../models/mod';

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
    },
    {
      name: 'SPT Realism Mod',
      fileUrl: 'https://hub.sp-tarkov.com/files/file/606-spt-realism-mod/',
      image: 'https://hub.sp-tarkov.com/files/images/file/24/606.png',
      kind: '',
    },
    {
      name: 'Tactical Gear Component',
      image: 'https://hub.sp-tarkov.com/files/images/file/08/1555.jpg',
      fileUrl: 'https://hub.sp-tarkov.com/files/file/1555-tactical-gear-component/',
      kind: 'Server mods, Equipment',
    },
    {
      name: "Amands's Graphics 2",
      fileUrl: 'https://hub.sp-tarkov.com/files/file/813-amands-s-graphics/',
      image: 'https://hub.sp-tarkov.com/files/images/file/f4/813.png',
      kind: '',
    },
    {
      name: 'SPT Realism Mod 2',
      fileUrl: 'https://hub.sp-tarkov.com/files/file/606-spt-realism-mod/',
      image: 'https://hub.sp-tarkov.com/files/images/file/24/606.png',
      kind: '',
    },
    {
      name: 'Tactical Gear Component 2',
      image: 'https://hub.sp-tarkov.com/files/images/file/08/1555.jpg',
      fileUrl: 'https://hub.sp-tarkov.com/files/file/1555-tactical-gear-component/',
      kind: 'Server mods, Equipment',
    },
  ]);
  readonly modListSignal = this.modList.asReadonly();

  addMod(mod: Mod) {
    if (this.modList().some(m => m.name === mod.name)) {
      return;
    }

    this.modList.update(modItems => [...modItems, mod]);
  }

  removeMod(name: string) {
    this.modList.update(() => [...this.modList().filter(m => m.name !== name)]);
  }
}

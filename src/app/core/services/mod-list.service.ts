import { Injectable, signal } from '@angular/core';
import { UserSettingModel } from '../../../../shared/models/user-setting.model';

export interface ModItem {
  modName: string;
  modImage: string;
  modFileUrl: string;
  modKind: string;
}

@Injectable({
  providedIn: 'root',
})
export class ModListService {
  private modList = signal<ModItem[]>([
    {
      modName: "Amands's Graphics",
      modFileUrl: 'https://hub.sp-tarkov.com/files/file/813-amands-s-graphics/',
      modImage: 'https://hub.sp-tarkov.com/files/images/file/f4/813.png',
      modKind: '',
    },
    {
      modName: 'SPT Realism Mod',
      modFileUrl: 'https://hub.sp-tarkov.com/files/file/606-spt-realism-mod/',
      modImage: 'https://hub.sp-tarkov.com/files/images/file/24/606.png',
      modKind: '',
    },
    {
      modName: 'Tactical Gear Component',
      modImage: 'https://hub.sp-tarkov.com/files/images/file/08/1555.jpg',
      modFileUrl: 'https://hub.sp-tarkov.com/files/file/1555-tactical-gear-component/',
      modKind: 'Server mods, Equipment',
    },
    {
      modName: "Amands's Graphics 2",
      modFileUrl: 'https://hub.sp-tarkov.com/files/file/813-amands-s-graphics/',
      modImage: 'https://hub.sp-tarkov.com/files/images/file/f4/813.png',
      modKind: '',
    },
    {
      modName: 'SPT Realism Mod 2',
      modFileUrl: 'https://hub.sp-tarkov.com/files/file/606-spt-realism-mod/',
      modImage: 'https://hub.sp-tarkov.com/files/images/file/24/606.png',
      modKind: '',
    },
    {
      modName: 'Tactical Gear Component 2',
      modImage: 'https://hub.sp-tarkov.com/files/images/file/08/1555.jpg',
      modFileUrl: 'https://hub.sp-tarkov.com/files/file/1555-tactical-gear-component/',
      modKind: 'Server mods, Equipment',
    },
  ]);
  readonly modListSignal = this.modList.asReadonly();

  addModToModList(modItem: ModItem) {
    if (this.modList().some(m => m.modName === modItem.modName)) {
      return;
    }

    this.modList.update(modItems => ([...modItems, modItem]));
  }

  deleteModToModList(modName: string) {
    this.modList.update(() => [...this.modList().filter(m => m.modName !== modName)]);
  }
}

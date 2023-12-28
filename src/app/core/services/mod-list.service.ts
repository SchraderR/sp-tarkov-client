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
  ]);
  readonly modListSignal = this.modList.asReadonly();

  addModToModList(modItem: ModItem) {
    if (this.modList().some(m => m.modName === modItem.modName)) {
      return;
    }

    this.modList().push(modItem);
  }

  deleteModToModList(modItem: ModItem) {
    const index = this.modList().findIndex(m => m.modName === modItem.modName);
    this.modList().splice(index, 1);
  }
}

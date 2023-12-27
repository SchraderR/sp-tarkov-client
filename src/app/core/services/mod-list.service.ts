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
  private modList = signal<ModItem[]>([]);
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

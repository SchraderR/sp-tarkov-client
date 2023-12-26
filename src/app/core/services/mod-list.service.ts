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
    console.log(this.modList());
  }

  deleteModToModList(modItem: ModItem) {
    this.modList.set(this.modList().filter(m => m.modName !== modItem.modName));
    console.log(this.modList());
  }
}

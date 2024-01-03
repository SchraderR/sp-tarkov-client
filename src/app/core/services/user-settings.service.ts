import { Injectable, signal } from '@angular/core';
import { UserSettingModel } from '../../../../shared/models/user-setting.model';

@Injectable({
  providedIn: 'root',
})
export class UserSettingsService {
  private userSetting = signal<UserSettingModel[]>([]);
  readonly userSettingSignal = this.userSetting.asReadonly();

  setUserSetting(userSetting: UserSettingModel[]) {
    this.userSetting.set(userSetting);
  }

  updateUserSetting() {
    this.userSetting.update(state => [...state]);
  }

  getActiveInstance(): UserSettingModel | undefined {
    return this.userSetting().find(setting => setting.isActive);
  }
}

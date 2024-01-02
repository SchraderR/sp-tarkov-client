import { Injectable, signal } from '@angular/core';
import { AkiInstance, UserSettingModel, UserSettingStoreModel } from '../../../../shared/models/user-setting.model';

@Injectable({
  providedIn: 'root',
})
export class UserSettingsService {
  private userSetting = signal<UserSettingModel[]>([]);
  readonly userSettingSignal = this.userSetting.asReadonly();

  setUserSetting(userSetting: UserSettingModel[]) {
    this.userSetting.set(userSetting);
  }

  getActiveInstance(): AkiInstance | undefined {
    return this.userSetting().find(setting => setting.isActive);
  }
}

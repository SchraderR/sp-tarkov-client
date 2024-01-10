import { Injectable, signal } from '@angular/core';
import { UserSettingModel } from '../../../../shared/models/user-setting.model';
import { Mod } from '../models/mod';

@Injectable({
  providedIn: 'root',
})
export class UserSettingsService {
  private userSetting = signal<UserSettingModel[]>([]);
  readonly userSettingSignal = this.userSetting.asReadonly();

  setUserSetting(userSetting: UserSettingModel[]) {
    this.userSetting.set(userSetting);
  }

  addUserSetting(settingModel: UserSettingModel) {
    if (this.userSetting().some(userSetting => userSetting.akiRootDirectory === settingModel.akiRootDirectory)) {
      return;
    }

    this.userSetting.update(userSettings => [...userSettings, { ...settingModel }]);
  }

  updateUserSetting() {
    this.userSetting.update(state => [...state]);
  }

  removeUserSetting(akiRootDirectory: string) {
    this.userSetting.update(() => [...this.userSetting().filter(m => m.akiRootDirectory !== akiRootDirectory)]);
  }

  getActiveInstance(): UserSettingModel | undefined {
    return this.userSetting().find(setting => setting.isActive);
  }
}

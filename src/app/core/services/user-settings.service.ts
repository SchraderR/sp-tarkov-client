import { Injectable, signal } from '@angular/core';
import { Theme, UserSettingModel } from '../../../../shared/models/user-setting.model';

@Injectable({
  providedIn: 'root',
})
export class UserSettingsService {
  private userSetting = signal<UserSettingModel[]>([]);
  readonly userSettingSignal = this.userSetting.asReadonly();
  currentTheme = signal<Theme | null>(null);
  isTutorialDone = signal<boolean | null>(null);

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

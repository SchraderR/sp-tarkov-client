import { Injectable, signal } from '@angular/core';
import { Theme, UserSettingModel } from '../../../../shared/models/user-setting.model';
import { AkiCore } from '../../../../shared/models/aki-core.model';

@Injectable({
  providedIn: 'root',
})
export class UserSettingsService {
  private userSetting = signal<UserSettingModel[]>([]);
  readonly userSettingSignal = this.userSetting.asReadonly();
  currentTheme = signal<Theme | null>(null);
  isExperimentalFunctionActive = signal<boolean>(false);
  isTutorialDone = signal<boolean | null>(null);

  addUserSetting(settingModel: UserSettingModel) {
    if (this.userSetting().some(userSetting => userSetting.akiRootDirectory === settingModel.akiRootDirectory)) {
      return;
    }

    this.userSetting.update(userSettings => [...userSettings, { ...settingModel }]);
  }

  updateUserSetting() {
    this.userSetting.update(state => [...state]);
  }

  updateTutorialDone(state: boolean) {
    this.isTutorialDone.update(() => state);
  }

  removeUserSetting(akiRootDirectory: string) {
    this.userSetting.update(() => [...this.userSetting().filter(m => m.akiRootDirectory !== akiRootDirectory)]);
  }

  getActiveInstance(): UserSettingModel | undefined {
    return this.userSetting().find(setting => setting.isActive);
  }

  checkInstanceOrFake() {
    if (!this.userSettingSignal().length) {
      this.userSetting.set([
        {
          akiRootDirectory: 'C://TutorialPath/SPT',
          serverMods: [],
          clientMods: [],
          isActive: false,
          akiCore: {
            akiVersion: '4.0.0',
          } as unknown as AkiCore,
          isLoading: false,
          isError: false,
          isValid: true,
        },
      ]);
    }
  }

  clearFakeInstance() {
    this.userSetting.set([]);
  }
}

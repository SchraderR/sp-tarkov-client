import { Injectable, signal } from '@angular/core';
import { Theme, UserSettingModel } from '../../../../shared/models/user-setting.model';
import { SptCore } from '../../../../shared/models/spt-core.model';

@Injectable({
  providedIn: 'root',
})
export class UserSettingsService {
  private userSetting = signal<UserSettingModel[]>([]);
  readonly userSettingSignal = this.userSetting.asReadonly();
  currentTheme = signal<Theme | null>(null);
  isExperimentalFunctionActive = signal<boolean>(false);
  keepTempDownloadDirectory = signal<boolean>(false);
  keepTempDownloadDirectorySize = signal<{ size: number; text: string }>({ text: '', size: 0 });
  isTutorialDone = signal<boolean | null>(null);
  wasInstanceOverviewReviewed = signal<boolean>(false);

  addUserSetting(settingModel: UserSettingModel) {
    if (this.userSetting().some(userSetting => userSetting.sptRootDirectory === settingModel.sptRootDirectory)) {
      return;
    }

    this.userSetting.update(userSettings => [...userSettings, { ...settingModel }]);
  }

  updateUserSetting() {
    this.userSetting.update(state => [...state]);
  }

  updateTutorialDone(state: boolean | null) {
    this.isTutorialDone.update(() => state);
  }

  removeUserSetting(akiRootDirectory: string) {
    this.userSetting.update(() => [...this.userSetting().filter(m => m.sptRootDirectory !== akiRootDirectory)]);
  }

  getActiveInstance(): UserSettingModel | undefined {
    return this.userSetting().find(setting => setting.isActive);
  }

  checkInstanceOrFake() {
    if (!this.userSettingSignal().length) {
      this.userSetting.set([
        {
          sptRootDirectory: 'C://TutorialPath/SPT',
          serverMods: [],
          clientMods: [],
          isActive: false,
          isPowerShellIssue: false,
          sptCore: {
            sptVersion: '4.0.0',
          } as unknown as SptCore,
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

import { inject, Injectable, signal } from '@angular/core';
import { Theme, UserSettingModel } from '../../../../shared/models/user-setting.model';
import { SptCore } from '../../../../shared/models/spt-core.model';
import { ElectronService } from './electron.service';
import { tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserSettingsService {
  #electronService = inject(ElectronService);

  private userSetting = signal<UserSettingModel[]>([]);
  readonly userSettingSignal = this.userSetting.asReadonly();
  currentTheme = signal<Theme | null>(null);
  isExperimentalFunctionActive = signal<boolean>(false);
  keepTempDownloadDirectory = signal<boolean>(false);
  keepTempDownloadDirectorySize = signal<{ size: number; text: string }>({ text: '', size: 0 });
  isTutorialDone = signal<boolean | null>(null);
  wasModLoadOrderWarningReviewed = signal<boolean>(false);

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

  getActiveInstance(): UserSettingModel | null {
    const activeInstance = this.userSetting().find(setting => setting.isActive);
    if(!activeInstance) {
      return null;
    }

    return activeInstance;
  }

  checkInstanceOrFake() {
    if (!this.userSettingSignal().length) {
      this.userSetting.set([
        {
          sptRootDirectory: 'C://TutorialPath/SPT',
          serverMods: [],
          clientMods: [],
          isActive: false,
          trackedMods: [],
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

  getCurrentTrackedModSetting(userSetting: UserSettingModel) {
    return this.#electronService
      .sendEvent<UserSettingModel, string>('user-setting', userSetting.sptRootDirectory ?? userSetting.akiRootDirectory)
      .pipe(
        tap(value => {
          userSetting.trackedMods = value.args.trackedMods;
          this.updateUserSetting();
        })
      );
  }
}

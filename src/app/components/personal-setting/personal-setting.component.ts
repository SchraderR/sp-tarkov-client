import { ChangeDetectorRef, Component, DestroyRef, inject, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ElectronService } from '../../core/services/electron.service';
import { AkiInstance, UserSettingModel } from '../../../../shared/models/user-setting.model';
import { MatCardModule } from '@angular/material/card';
import { UserSettingsService } from '../../core/services/user-settings.service';
import { MatIconModule } from '@angular/material/icon';
import { switchMap } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-personal-setting',
  templateUrl: './personal-setting.component.html',
  styleUrls: ['./personal-setting.component.scss'],
  imports: [CommonModule, MatButtonModule, MatCardModule, MatIconModule],
})
export default class PersonalSettingComponent {
  #destroyRef = inject(DestroyRef);
  #electronService = inject(ElectronService);
  #userSettingsService = inject(UserSettingsService);
  #ngZone = inject(NgZone);
  #changeDetectorRef = inject(ChangeDetectorRef);

  readonly userSettingSignal = this.#userSettingsService.userSettingSignal;

  getRootEftSpDirectory() {
    this.#electronService
      .sendEvent('open-directory')
      .pipe(
        switchMap(() => this.#electronService.sendEvent<UserSettingModel[]>('user-settings')),
        takeUntilDestroyed(this.#destroyRef)
      )
      .subscribe(result => this.updateUserSettingAndDetectChanges(result?.args || []));
  }

  setActiveInstance(settingModel: UserSettingModel) {
    this.userSettingSignal().forEach(us => (us.isActive = false));
    settingModel.isActive = true;
    this.#userSettingsService.updateUserSetting();

    const akiInstance: AkiInstance = {
      isActive: settingModel.isActive,
      akiRootDirectory: settingModel.akiRootDirectory,
      isValid: settingModel.isValid,
      clientMods: settingModel.clientMods,
      serverMods: settingModel.serverMods
    };

    this.#electronService
      .sendEvent('user-settings-update', akiInstance)
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe(value => console.log(value));
  }

  removeInstance(settingModel: UserSettingModel) {
    this.#electronService
      .sendEvent('user-settings-remove', settingModel.akiRootDirectory)
      .pipe(
        switchMap(() => this.#electronService.sendEvent<UserSettingModel[]>('user-settings')),
        takeUntilDestroyed(this.#destroyRef)
      )
      .subscribe(result => this.updateUserSettingAndDetectChanges(result?.args || []));
  }

  private updateUserSettingAndDetectChanges(userSettings: UserSettingModel[]) {
    this.#ngZone.run(() => {
      this.#userSettingsService.setUserSetting(userSettings);
      this.#changeDetectorRef.detectChanges();
    });
  }
}

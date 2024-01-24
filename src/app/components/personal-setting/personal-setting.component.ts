import { ChangeDetectorRef, Component, DestroyRef, inject, NgZone, signal } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ElectronService } from '../../core/services/electron.service';
import { AkiInstance, ModMeta, UserSettingModel } from '../../../../shared/models/user-setting.model';
import { MatCardModule } from '@angular/material/card';
import { UserSettingsService } from '../../core/services/user-settings.service';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin, of, switchMap, tap } from 'rxjs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { MatLineModule } from '@angular/material/core';

@Component({
  standalone: true,
  selector: 'app-personal-setting',
  templateUrl: './personal-setting.component.html',
  styleUrls: ['./personal-setting.component.scss'],
  imports: [MatButtonModule, MatCardModule, MatIconModule, MatTooltipModule, MatExpansionModule, MatListModule, MatLineModule],
})
export default class PersonalSettingComponent {
  #destroyRef = inject(DestroyRef);
  #electronService = inject(ElectronService);
  #userSettingsService = inject(UserSettingsService);
  #changeDetectorRef = inject(ChangeDetectorRef);
  #ngZone = inject(NgZone);

  readonly userSettingSignal = this.#userSettingsService.userSettingSignal;

  getRootEftSpDirectory() {
    this.#electronService
      .sendEvent<UserSettingModel>('open-directory')
      .pipe(
        switchMap(result => {
          return forkJoin({
            userSetting: of(result.args),
            serverMods: this.#electronService.sendEvent<ModMeta[], string>('server-mod', result.args.akiRootDirectory),
            clientMods: this.#electronService.sendEvent<ModMeta[], string>('client-mod', result.args.akiRootDirectory),
          });
        }),
        tap(result => {
          this.#ngZone.run(() => {
            const newUserSetting = result.userSetting;
            newUserSetting.clientMods = result.clientMods.args;
            newUserSetting.serverMods = result.serverMods.args;

            this.#userSettingsService.addUserSetting(newUserSetting);
            this.#changeDetectorRef.detectChanges();
          });
        }),
        takeUntilDestroyed(this.#destroyRef)
      )
      .subscribe();
  }

  openExternalChromePath() {
    void this.#electronService.shell.openExternal("C:\\Users");
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
      serverMods: settingModel.serverMods,
    };

    this.#electronService.sendEvent('user-settings-update', akiInstance).pipe(takeUntilDestroyed(this.#destroyRef)).subscribe();
  }

  removeInstance(settingModel: UserSettingModel) {
    this.#electronService.sendEvent('user-settings-remove', settingModel.akiRootDirectory).subscribe(() => {
      this.#ngZone.run(() => {
        this.#userSettingsService.removeUserSetting(settingModel.akiRootDirectory);
        this.#userSettingsService.updateUserSetting();
      });
    });
  }
}

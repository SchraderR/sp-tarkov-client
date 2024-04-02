import { ChangeDetectorRef, Component, computed, DestroyRef, inject, NgZone } from '@angular/core';
import { UserSettingsService } from '../../core/services/user-settings.service';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { ElectronService } from '../../core/services/electron.service';
import { ModMeta, UserSettingModel } from '../../../../shared/models/user-setting.model';
import { catchError, concatAll, forkJoin, of, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  standalone: true,
  selector: 'app-instance-overview',
  templateUrl: './instance-overview.component.html',
  styleUrl: './instance-overview.component.scss',
  imports: [CommonModule, RouterLink, MatButtonModule, MatProgressSpinner, MatListModule, MatIconModule],
})
export default class InstanceOverviewComponent {
  #userSettingsService = inject(UserSettingsService);
  #electronService = inject(ElectronService);
  #ngZone = inject(NgZone);
  #changeDetectorRef = inject(ChangeDetectorRef);
  #destroyRef = inject(DestroyRef);

  activeAkiInstance = computed(() => {
    this.getCurrentPersonalSettings();

    return this.#userSettingsService.userSettingSignal().find(i => i.isActive);
  });

  openExternal(modPath: string) {
    this.#electronService.openPath(modPath);
  }

  openRealismTool(modPath: string) {
    this.#electronService.openPath(modPath + '/RealismModConfig.exe');
  }

  openSVMTool(modPath: string) {
    this.#electronService.openPath(modPath + '/GFVE.exe');
  }

  private getCurrentPersonalSettings() {
    this.#electronService
      .sendEvent<UserSettingModel[]>('user-settings')
      .pipe(
        switchMap(res => res && this.getServerMods(res.args)),
        concatAll(),
        takeUntilDestroyed(this.#destroyRef)
      )
      .subscribe(value => {
        this.#ngZone.run(() => {
          const userSetting = this.#userSettingsService.userSettingSignal().find(s => s.akiRootDirectory === value.userSetting.akiRootDirectory);
          if (!userSetting) {
            return;
          }

          userSetting.clientMods = value.clientMods.args;
          userSetting.serverMods = value.serverMods.args;
          userSetting.isError = value.userSetting.isError;
          userSetting.isLoading = false;

          this.#userSettingsService.updateUserSetting();
          this.#changeDetectorRef.detectChanges();
        });
      });
  }

  private getServerMods(userSettings: UserSettingModel[]) {
    return userSettings.map(userSetting => {
      const newUserSetting: UserSettingModel = { ...userSetting, isLoading: true };
      this.#userSettingsService.addUserSetting(newUserSetting);
      this.#changeDetectorRef.detectChanges();

      return forkJoin({
        userSetting: of(userSetting),
        serverMods: this.#electronService.sendEvent<ModMeta[], string>('server-mod', userSetting.akiRootDirectory),
        clientMods: this.#electronService.sendEvent<ModMeta[], string>('client-mod', userSetting.akiRootDirectory),
      }).pipe(catchError(() => this.handleDirectoryPathError(userSetting)));
    });
  }

  private handleDirectoryPathError(userSetting: UserSettingModel) {
    userSetting.isError = true;

    return of({
      userSetting: userSetting,
      serverMods: { args: [] },
      clientMods: { args: [] },
    });
  }
}

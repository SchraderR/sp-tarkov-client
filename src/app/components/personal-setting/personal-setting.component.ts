import { ChangeDetectorRef, Component, DestroyRef, inject, NgZone } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ElectronService } from '../../core/services/electron.service';
import { AkiInstance, ModMeta, UserSettingModel } from '../../../../shared/models/user-setting.model';
import { MatCardModule } from '@angular/material/card';
import { UserSettingsService } from '../../core/services/user-settings.service';
import { MatIconModule } from '@angular/material/icon';
import { catchError, EMPTY, forkJoin, of, switchMap, tap } from 'rxjs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { MatLineModule } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { fadeInFadeOutAnimation } from '../../core/animations/fade-in-out.animation';

@Component({
  standalone: true,
  selector: 'app-personal-setting',
  templateUrl: './personal-setting.component.html',
  styleUrls: ['./personal-setting.component.scss'],
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatTooltipModule,
    MatExpansionModule,
    MatListModule,
    MatLineModule,
    MatFormFieldModule,
    MatSelectModule,
    ReactiveFormsModule,
  ],
  animations: [fadeInFadeOutAnimation],
})
export default class PersonalSettingComponent {
  #destroyRef = inject(DestroyRef);
  #electronService = inject(ElectronService);
  #userSettingsService = inject(UserSettingsService);
  #changeDetectorRef = inject(ChangeDetectorRef);
  #matSnackBar = inject(MatSnackBar);
  #ngZone = inject(NgZone);

  readonly userSettingSignal = this.#userSettingsService.userSettingSignal;
  currentTheme = new FormControl();
  hoveringInstance: string = '';

  changeTheme(event: MatSelectChange) {
    console.log(event);
    // this.#userSettingsService.updateUserSetting();
  }

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
        catchError((error: { message: string }) => {
          this.#ngZone.run(() => {
            this.#matSnackBar.open(error.message, '', {
              duration: 3000,
              verticalPosition: 'bottom',
              horizontalPosition: 'center',
            });
          });

          return EMPTY;
        }),
        takeUntilDestroyed(this.#destroyRef)
      )
      .subscribe();
  }

  openExternalChromePath() {
    void this.#electronService.shell.openExternal('C:\\Users');
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

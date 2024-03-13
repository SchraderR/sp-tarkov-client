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
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { fadeInFadeOutAnimation } from '../../core/animations/fade-in-out.animation';
import { JoyrideModule } from 'ngx-joyride';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';

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
    JoyrideModule,
    NgOptimizedImage,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
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
  currentTheme = new FormControl(this.#userSettingsService.currentTheme());
  experimentalFunctionsActive = new FormControl(this.#userSettingsService.isExperimentalFunctionActive());
  hoveringInstance: string = '';

  changeTheme(event: MatSelectChange) {
    this.#electronService.sendEvent('theme-toggle', event.value).subscribe(() => this.#userSettingsService.currentTheme.set(event.value));
  }

  toggleExperimentalFunction(event: MatSlideToggleChange) {
    this.#electronService.sendEvent('exp-function-toggle', event.checked).subscribe(() => {
      this.#ngZone.run(() => this.#userSettingsService.isExperimentalFunctionActive.set(event.checked));
    });
  }

  openInstance(akiRootDirectory: string) {
    this.#electronService.openPath(akiRootDirectory);
  }

  getRootEftSpDirectory() {
    this.#electronService
      .sendEvent<UserSettingModel>('open-directory')
      .pipe(
        switchMap(result => {
          const newUserSetting: UserSettingModel = { ...result.args, isLoading: true };

          console.log(this.#userSettingsService.userSettingSignal().length);

          this.#userSettingsService.addUserSetting(newUserSetting);
          this.#changeDetectorRef.detectChanges();

          return forkJoin({
            userSetting: of(newUserSetting),
            serverMods: this.#electronService.sendEvent<ModMeta[], string>('server-mod', result.args.akiRootDirectory),
            clientMods: this.#electronService.sendEvent<ModMeta[], string>('client-mod', result.args.akiRootDirectory),
          });
        }),
        tap(result => {
          this.#ngZone.run(() => {
            const userSetting = this.#userSettingsService.userSettingSignal().find(s => s.akiRootDirectory === result.userSetting.akiRootDirectory);
            if (!userSetting) {
              return;
            }

            userSetting.clientMods = result.clientMods.args;
            userSetting.serverMods = result.serverMods.args;
            userSetting.isLoading = false;
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

  setActiveInstance(settingModel: UserSettingModel) {
    this.userSettingSignal().forEach(us => (us.isActive = false));
    settingModel.isActive = true;
    this.#userSettingsService.updateUserSetting();

    const akiInstance: AkiInstance = {
      isActive: settingModel.isActive,
      akiRootDirectory: settingModel.akiRootDirectory,
      isValid: settingModel.isValid,
      isLoading: settingModel.isLoading,
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

import { ChangeDetectorRef, Component, DestroyRef, inject, NgZone, QueryList, ViewChildren } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ElectronService } from '../../core/services/electron.service';
import { SptInstance, ModMeta, UserSettingModel } from '../../../../shared/models/user-setting.model';
import { MatCardModule } from '@angular/material/card';
import { UserSettingsService } from '../../core/services/user-settings.service';
import { MatIconModule } from '@angular/material/icon';
import { catchError, EMPTY, forkJoin, of, switchMap, tap } from 'rxjs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListItem, MatListModule } from '@angular/material/list';
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
  @ViewChildren('loading') matList: QueryList<MatListItem> | undefined;

  #destroyRef = inject(DestroyRef);
  #electronService = inject(ElectronService);
  #userSettingsService = inject(UserSettingsService);
  #changeDetectorRef = inject(ChangeDetectorRef);
  #matSnackBar = inject(MatSnackBar);
  #ngZone = inject(NgZone);

  readonly userSettingSignal = this.#userSettingsService.userSettingSignal;
  currentTheme = new FormControl(this.#userSettingsService.currentTheme());
  experimentalFunctionsActive = new FormControl(this.#userSettingsService.isExperimentalFunctionActive());
  hoveringInstance = '';

  changeTheme(event: MatSelectChange) {
    this.#electronService.sendEvent('theme-toggle', event.value).subscribe(() => this.#userSettingsService.currentTheme.set(event.value));
  }

  toggleExperimentalFunction(event: MatSlideToggleChange) {
    this.#electronService.sendEvent('exp-function-toggle', event.checked).subscribe(() => {
      this.#ngZone.run(() => this.#userSettingsService.isExperimentalFunctionActive.set(event.checked));
    });
  }

  openInstance(rootDirectory: string) {
    this.#electronService.openPath(rootDirectory);
  }

  restartTutorial() {
    this.#userSettingsService.updateTutorialDone(false);
  }

  clearSptVersionCache() {
    this.#electronService.sendEvent('spt-versions-save', []).subscribe(() => this.cacheClearToast('Spt-Versions'));
  }

  clearSptTagsCache() {
    this.#electronService.sendEvent('spt-tags-save', []).subscribe(() => this.cacheClearToast('Spt-Tags'));
  }

  getRootEftSpDirectory() {
    this.#electronService
      .sendEvent<UserSettingModel>('open-directory')
      .pipe(
        switchMap(result => {
          const newUserSetting: UserSettingModel = { ...result.args, isLoading: true };
          this.#userSettingsService.addUserSetting(newUserSetting);
          this.#changeDetectorRef.detectChanges();

          this.matList?.last?._elementRef.nativeElement.scrollIntoView({ behavior: 'smooth' });

          return forkJoin({
            userSetting: of(newUserSetting),
            serverMods: this.#electronService.sendEvent<ModMeta[], string>('server-mod', result.args.sptRootDirectory),
            clientMods: this.#electronService.sendEvent<ModMeta[], string>('client-mod', result.args.sptRootDirectory),
          }).pipe(catchError(() => this.handleDirectoryPathError(result.args)));
        }),
        tap(result => {
          this.#ngZone.run(() => {
            const userSetting = this.#userSettingsService.userSettingSignal().find(s => s.sptRootDirectory === result.userSetting.sptRootDirectory);
            if (!userSetting) {
              return;
            }

            userSetting.clientMods = result.clientMods.args;
            userSetting.serverMods = result.serverMods.args;
            userSetting.isError = result.userSetting.isError;
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
        })
      )
      .subscribe();
  }

  setActiveInstance(settingModel: UserSettingModel) {
    this.userSettingSignal().forEach(us => (us.isActive = false));
    settingModel.isActive = true;
    this.#userSettingsService.updateUserSetting();

    const sptInstance: SptInstance = {
      isActive: settingModel.isActive,
      sptRootDirectory: settingModel.sptRootDirectory,
      isValid: settingModel.isValid,
      isLoading: settingModel.isLoading,
      isError: settingModel.isError,
      clientMods: settingModel.clientMods,
      serverMods: settingModel.serverMods,
    };

    this.#electronService.sendEvent('user-settings-update', sptInstance).pipe(takeUntilDestroyed(this.#destroyRef)).subscribe();
  }

  removeInstance(settingModel: UserSettingModel) {
    this.#electronService.sendEvent('user-settings-remove', settingModel.sptRootDirectory).subscribe(() => {
      this.#ngZone.run(() => {
        this.#userSettingsService.removeUserSetting(settingModel.sptRootDirectory);
        this.#userSettingsService.updateUserSetting();
      });
    });
  }

  private handleDirectoryPathError(userSettingModel: UserSettingModel) {
    userSettingModel.isError = true;

    this.#matSnackBar.open(
      `Instance: ${userSettingModel.sptRootDirectory}\nServer/Client Paths not found.\nMake sure you started the SPT-Server at least one time.`,
      '',
      {
        duration: 3000,
        verticalPosition: 'bottom',
        horizontalPosition: 'center',
        panelClass: ['snackbar-multiline'],
      }
    );

    return of({
      userSetting: userSettingModel,
      serverMods: { args: [] },
      clientMods: { args: [] },
    });
  }

  private cacheClearToast(type: 'Spt-Versions' | 'Spt-Tags'): void {
    this.#ngZone.run(() => {
      this.#matSnackBar.open(`${type} cache was cleared. ${type} will be fetched on the next startup.`, '', {
        duration: 3000,
        verticalPosition: 'bottom',
        horizontalPosition: 'center',
      });
    });
  }
}

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
import { NgOptimizedImage } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { fadeInFadeOutAnimation } from '../../core/animations/fade-in-out.animation';
import { JoyrideModule } from 'ngx-joyride';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { DirectoryError } from '../../core/models/directory-error';
import { FileHelper } from '../../core/helper/file-helper';

@Component({
  selector: 'app-personal-setting',
  templateUrl: './personal-setting.component.html',
  styleUrls: ['./personal-setting.component.scss'],
  imports: [
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
  keepTempDownloadDirectory = new FormControl(this.#userSettingsService.keepTempDownloadDirectory());
  checkInstalledMod = new FormControl(this.#userSettingsService.checkInstalledMod());
  currentTempDirectorySize = this.#userSettingsService.keepTempDownloadDirectorySize;
  hoveringInstance = '';

  changeTheme(event: MatSelectChange) {
    this.#electronService.sendEvent('theme-toggle', event.value).subscribe(() => this.#userSettingsService.currentTheme.set(event.value));
  }

  toggleExperimentalFunction(event: MatSlideToggleChange) {
    this.#electronService.sendEvent('exp-function-toggle', event.checked).subscribe(() => {
      this.#ngZone.run(() => this.#userSettingsService.isExperimentalFunctionActive.set(event.checked));
    });
  }

  toggleKeepTempDirectory(event: MatSlideToggleChange) {
    this.#electronService.sendEvent('keep-temp-dir-setting-toggle', event.checked).subscribe(() => {
      this.#ngZone.run(() => this.#userSettingsService.keepTempDownloadDirectory.set(event.checked));
    });
  }

  toggleCheckInstalledMod(event: MatSlideToggleChange) {
    this.#electronService.sendEvent('check-installed-toggle', event.checked).subscribe(() => {
      this.#ngZone.run(() => this.#userSettingsService.checkInstalledMod.set(event.checked));
    });
  }

  openTemporaryDownloadDirectory() {
    const activeInstance = this.userSettingSignal().find(i => i.isActive);
    if (!activeInstance) {
      return;
    }

    if (this.currentTempDirectorySize().size > 0) {
      this.#electronService.openPath(`${activeInstance.sptRootDirectory ?? activeInstance.akiRootDirectory}/_temp`);
    }
  }

  clearTemporaryDownloadDirectory() {
    const activeInstance = this.userSettingSignal().find(i => i.isActive);
    if (!activeInstance) {
      return;
    }

    this.#electronService
      .sendEvent('clear-temp', activeInstance.sptRootDirectory ?? activeInstance.akiRootDirectory)
      .pipe(
        switchMap(() =>
          this.#electronService.sendEvent<number, string>('temp-dir-size', activeInstance.sptRootDirectory ?? activeInstance.akiRootDirectory)
        )
      )
      .subscribe(value => {
        this.#ngZone.run(() => {
          this.#userSettingsService.keepTempDownloadDirectorySize.set({
            size: value.args,
            text: FileHelper.fileSize(value.args),
          });
          this.#changeDetectorRef.detectChanges();
        });
      });
  }

  openInstance(rootDirectory: string) {
    this.#electronService.openPath(rootDirectory);
  }

  restartTutorial() {
    this.#electronService.sendEvent('tutorial-toggle', false).subscribe(() => this.#userSettingsService.updateTutorialDone(false));
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
          }).pipe(catchError(error => this.handleDirectoryPathError(error, result.args)));
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
      isPowerShellIssue: settingModel.isPowerShellIssue,
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

  private handleDirectoryPathError(error: DirectoryError, userSettingModel: UserSettingModel) {
    if (error.isPowerShellIssue) {
      userSettingModel.isPowerShellIssue = true;
    } else {
      userSettingModel.isError = true;
    }

    const errorMessage = userSettingModel.isPowerShellIssue
      ? 'Powershell could not be used. \nPlease make sure, Powershell is configure correctly and environment variable are set correctly.'
      : `Instance: ${userSettingModel.sptRootDirectory}\nServer/Client Paths not found.\nMake sure you started the SPT-Server at least one time.`;

    this.#matSnackBar.open(errorMessage, '', {
      duration: 3000,
      verticalPosition: 'bottom',
      horizontalPosition: 'center',
      panelClass: ['snackbar-multiline'],
    });

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

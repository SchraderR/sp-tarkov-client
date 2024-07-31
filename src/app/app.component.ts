import { ChangeDetectorRef, Component, DestroyRef, effect, inject, NgZone, ViewChild } from '@angular/core';
import { environment } from '../environments/environment';
import packageJson from '../../package.json';
import { Router, RouterModule } from '@angular/router';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { CommonModule, DatePipe, NgOptimizedImage } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { ElectronService } from './core/services/electron.service';
import { ModCache, ModMeta, Theme, UserSettingModel } from '../../shared/models/user-setting.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UserSettingsService } from './core/services/user-settings.service';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { ModSearchComponent } from './components/mod-search/mod-search.component';
import { ModListService } from './core/services/mod-list.service';
import { MatBadgeModule } from '@angular/material/badge';
import { catchError, concatAll, filter, forkJoin, of, switchMap } from 'rxjs';
import { sidenavAnimation } from './sidenavAnimation';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { GithubRateLimit } from '../../shared/models/download.model';
import { JoyrideModule, JoyrideService } from 'ngx-joyride';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SnackbarTutorialHintComponent } from './components/snackbar-tutorial-hint/snackbar-tutorial-hint.component';
import { MatCardModule } from '@angular/material/card';
import { TarkovStartComponent } from './components/tarkov-start/tarkov-start.component';
import { DownloadService } from './core/services/download.service';
import { Mod } from './core/models/mod';
import { DirectoryError } from './core/models/directory-error';

@Component({
  standalone: true,
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [
    CommonModule,
    MatButtonModule,
    MatSidenavModule,
    RouterModule,
    MatToolbarModule,
    MatIconModule,
    MatListModule,
    MatInputModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    NgOptimizedImage,
    ModSearchComponent,
    MatBadgeModule,
    MatTooltipModule,
    MatMenuModule,
    DatePipe,
    JoyrideModule,
    MatCardModule,
    TarkovStartComponent,
  ],
  animations: [sidenavAnimation],
})
export class AppComponent {
  #matIconRegistry = inject(MatIconRegistry);
  #electronService = inject(ElectronService);
  #userSettingService = inject(UserSettingsService);
  #downloadService = inject(DownloadService);
  #destroyRef = inject(DestroyRef);
  #modListService = inject(ModListService);
  #joyrideService = inject(JoyrideService);
  #matSnackBar = inject(MatSnackBar);
  #router = inject(Router);
  #ngZone = inject(NgZone);
  #changeDetectorRef = inject(ChangeDetectorRef);

  config = environment;
  version = packageJson.version;
  isExpanded = false;
  isTarkovInstanceRunExpanded = false;
  isExperimentalFunctionActive = this.#userSettingService.isExperimentalFunctionActive;

  @ViewChild(MatSidenav, { static: true }) matSideNav!: MatSidenav;

  modListSignal = this.#modListService.modListSignal;
  appIconPath = 'assets/images/icon.png';
  githubRateLimit: GithubRateLimit | undefined = undefined;

  constructor() {
    this.#matIconRegistry.setDefaultFontSetClass('material-symbols-outlined');
    this.#downloadService.isDownloadProcessCompleted
      .pipe(
        filter(r => r),
        takeUntilDestroyed()
      )
      .subscribe(() => this.getCurrentPersonalSettings());

    this.getCachedModList();
    this.getCurrentPersonalSettings();
    this.getCurrentThemeSettings();
    this.getCurrentTutorialSettings();
    this.getCurrentExpFunctionSettings();
    this.getGithubRateLimitInformation();

    effect(() => {
      const isTutorialDone = this.#userSettingService.isTutorialDone();
      if (isTutorialDone === false) {
        this.showTutorialSnackbar();
      }
    });
  }

  toggleDrawer = () => {
    this.isExpanded = false;
    void this.matSideNav.toggle();
  };

  openExternal = (url: string) => void this.#electronService.openExternal(url);
  sendWindowEvent = (event: 'window-minimize' | 'window-maximize' | 'window-close') =>
    void this.#electronService.sendEvent(event).pipe(takeUntilDestroyed(this.#destroyRef)).subscribe();

  openTarkovStartDrawer(): void {
    this.isTarkovInstanceRunExpanded = !this.isTarkovInstanceRunExpanded;
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
          const userSetting = this.#userSettingService.userSettingSignal().find(s => s.sptRootDirectory === value.userSetting.sptRootDirectory);
          if (!userSetting) {
            return;
          }

          userSetting.clientMods = value.clientMods.args;
          userSetting.serverMods = value.serverMods.args;
          userSetting.isError = value.userSetting.isError;
          userSetting.isPowerShellIssue = value.userSetting.isPowerShellIssue;
          userSetting.isLoading = false;

          this.#userSettingService.updateUserSetting();
          this.#changeDetectorRef.detectChanges();
        });
      });
  }

  private getServerMods(userSettings: UserSettingModel[]) {
    return userSettings.map(userSetting => {
      const newUserSetting: UserSettingModel = { ...userSetting, isLoading: true };
      this.#userSettingService.addUserSetting(newUserSetting);
      this.#changeDetectorRef.detectChanges();

      if(!newUserSetting.isValid) {
        return of({
          userSetting: { ...userSetting, isError: true },
          serverMods: { args: [] },
          clientMods: { args: [] },
        });
      }

      return forkJoin({
        userSetting: of(userSetting),
        serverMods: this.#electronService.sendEvent<ModMeta[], string>('server-mod', userSetting.sptRootDirectory),
        clientMods: this.#electronService.sendEvent<ModMeta[], string>('client-mod', userSetting.sptRootDirectory),
      }).pipe(catchError(error => this.handleDirectoryPathError(error, userSetting)));
    });
  }

  private getGithubRateLimitInformation() {
    this.#electronService.getGithubRateLimitInformation().subscribe(value => (this.githubRateLimit = value));
  }

  private getCurrentThemeSettings() {
    this.#electronService.sendEvent<Theme>('theme-setting').subscribe(value => this.#userSettingService.currentTheme.set(value.args));
  }

  private getCurrentExpFunctionSettings() {
    this.#electronService
      .sendEvent<boolean>('exp-function-setting')
      .subscribe(value => this.#userSettingService.isExperimentalFunctionActive.set(value.args));
  }

  private getCurrentTutorialSettings() {
    this.#electronService
      .sendEvent<boolean>('tutorial-setting')
      .subscribe(value => this.#ngZone.run(() => this.#userSettingService.isTutorialDone.set(value.args)));
  }

  private getCachedModList() {
    this.#electronService.sendEvent<ModCache[]>('mod-list-cache').subscribe(value =>
      this.#ngZone.run(() => {
        value.args.forEach(modCache => {
          const mod: Mod = { ...modCache, supportedSptVersion: `C*${modCache.supportedSptVersion}`, kind: undefined, notSupported: false };
          this.#modListService.addMod(mod);
        });

        console.log(value);
      })
    );
  }

  private showTutorialSnackbar() {
    let instanceSet = false;
    this.#matSnackBar
      .openFromComponent(SnackbarTutorialHintComponent, { horizontalPosition: 'end' })
      .afterDismissed()
      .subscribe(selection => {
        if (selection.dismissedByAction) {
          instanceSet = !!this.#userSettingService.userSettingSignal().length;

          this.#joyrideService
            .startTour({
              steps: [
                'settingStepInstance@setting',
                'settingStepInstanceActive@setting',
                'sideNavStep',
                'downloadStep',
                'downloadOverviewStep@mod-list',
              ],
            })
            .subscribe({
              next: step => {
                if (step.name === 'downloadStep') {
                  this.#modListService.addFakeModForTutorial();
                }

                if (step.name === 'settingStepInstance') {
                  this.#userSettingService.checkInstanceOrFake();
                }
              },
              complete: () => {
                if (!instanceSet) {
                  this.#userSettingService.clearFakeInstance();
                }
                this.#modListService.clearFakeTutorialMods();
                this.#electronService.sendEvent('tutorial-toggle', true).subscribe();
                this.#userSettingService.updateTutorialDone(true);
                void this.#router.navigate(['/setting']);
              },
            });
          this.#electronService.sendEvent('tutorial-toggle', true).subscribe(() => this.#userSettingService.updateTutorialDone(true));
        }
      });
  }

  private handleDirectoryPathError(error: DirectoryError, userSettingModel: UserSettingModel) {
    console.log(error);
    if (error.isPowerShellIssue) {
      userSettingModel.isPowerShellIssue = true;
    } else {
      userSettingModel.isError = true;
    }

    return of({
      userSetting: userSettingModel,
      serverMods: { args: [] },
      clientMods: { args: [] },
    });
  }
}

import { ChangeDetectorRef, Component, DestroyRef, inject, NgZone, ViewChild } from '@angular/core';
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
import { ModMeta, Theme, UserSettingModel } from '../../shared/models/user-setting.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UserSettingsService } from './core/services/user-settings.service';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { ModSearchComponent } from './components/mod-search/mod-search.component';
import { ModListService } from './core/services/mod-list.service';
import { MatBadgeModule } from '@angular/material/badge';
import { concatAll, forkJoin, of, switchMap } from 'rxjs';
import { sidenavAnimation } from './sidenavAnimation';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { GithubRateLimit } from '../../shared/models/download.model';
import { JoyrideModule, JoyrideService } from 'ngx-joyride';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SnackbarTutorialHintComponent } from './components/snackbar-tutorial-hint/snackbar-tutorial-hint.component';
import { MatCardModule } from '@angular/material/card';
import { TarkovStartComponent } from './components/tarkov-start/tarkov-start.component';

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
    this.getCurrentPersonalSettings();
    this.getCurrentThemeSettings();
    this.getCurrentTutorialSettings();
    this.getCurrentExpFunctionSettings();

    this.getGithubRateLimitInformation();
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
        takeUntilDestroyed()
      )
      .subscribe(value => {
        this.#ngZone.run(() => {
          const userSetting = this.#userSettingService.userSettingSignal().find(s => s.akiRootDirectory === value.userSetting.akiRootDirectory);
          if (!userSetting) {
            return;
          }

          userSetting.clientMods = value.clientMods.args;
          userSetting.serverMods = value.serverMods.args;
          userSetting.isLoading = false;

          this.#userSettingService.userSettingSignal();
          this.#changeDetectorRef.detectChanges();
        });
      });
  }

  private getServerMods(userSettings: UserSettingModel[]) {
    return userSettings.map(userSetting => {
      const newUserSetting: UserSettingModel = { ...userSetting, isLoading: true };
      this.#userSettingService.addUserSetting(newUserSetting);
      this.#changeDetectorRef.detectChanges();

      return forkJoin({
        userSetting: of(userSetting),
        serverMods: this.#electronService.sendEvent<ModMeta[], string>('server-mod', userSetting.akiRootDirectory),
        clientMods: this.#electronService.sendEvent<ModMeta[], string>('client-mod', userSetting.akiRootDirectory),
      });
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
    this.#electronService.sendEvent<boolean>('tutorial-setting').subscribe(value => {
      this.#ngZone.run(() => {
        this.#userSettingService.isTutorialDone.set(value.args);

        if (!value.args) {
          this.#matSnackBar
            .openFromComponent(SnackbarTutorialHintComponent, { horizontalPosition: 'end' })
            .afterDismissed()
            .subscribe(selection => {
              if (selection.dismissedByAction) {
                this.#joyrideService
                  .startTour({ steps: ['settingStepInstance@setting', 'sideNavStep', 'downloadStep', 'downloadOverviewStep@mod-list'] })
                  .subscribe({
                    next: step => {
                      if (step.name === 'downloadStep') {
                        this.#modListService.addFakeModForTutorial();
                      }
                    },
                    complete: () => {
                      this.#modListService.clearFakeTutorialMods();
                      this.#electronService.sendEvent('tutorial-toggle').subscribe();
                      this.#router.navigate(['/setting']);
                    },
                  });
              } else {
                this.#electronService.sendEvent('tutorial-toggle').subscribe();
              }
            });
        }
      });
    });
  }
}

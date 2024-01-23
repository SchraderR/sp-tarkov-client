import { Component, DestroyRef, inject, NgZone, ViewChild } from '@angular/core';
import { environment } from '../environments/environment';
import packageJson from '../../package.json';
import { RouterModule } from '@angular/router';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { NgOptimizedImage } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { ElectronService } from './core/services/electron.service';
import { ModMeta, UserSettingModel } from '../../shared/models/user-setting.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UserSettingsService } from './core/services/user-settings.service';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { ModSearchComponent } from './components/mod-search/mod-search.component';
import { ModListService } from './core/services/mod-list.service';
import { MatBadgeModule } from '@angular/material/badge';
import { concatAll, forkJoin, of, switchMap, tap } from 'rxjs';
import { sidenavAnimation } from './sidenavAnimation';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  standalone: true,
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [
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
  ],
  animations: [sidenavAnimation],
})
export class AppComponent {
  #matIconRegistry = inject(MatIconRegistry);
  #electronService = inject(ElectronService);
  #userSettingService = inject(UserSettingsService);
  #destroyRef = inject(DestroyRef);
  #modListService = inject(ModListService);
  #ngZone = inject(NgZone);

  config = environment;
  version = packageJson.version;
  isExpanded = false;

  @ViewChild(MatSidenav, { static: true }) matSideNav!: MatSidenav;

  modListSignal = this.#modListService.modListSignal;
  appIconPath = 'assets/images/icon.png';

  constructor() {
    this.#matIconRegistry.setDefaultFontSetClass('material-symbols-outlined');
    this.getCurrentPersonalSettings();
  }

  toggleDrawer = () => {
    this.isExpanded = false;
    void this.matSideNav.toggle();
  };

  openExternal = (url: string) => void this.#electronService.shell.openExternal(url);
  sendWindowEvent = (event: 'window-minimize' | 'window-maximize' | 'window-close') => void this.#electronService.sendEvent(event).pipe(takeUntilDestroyed(this.#destroyRef)).subscribe();

  private getCurrentPersonalSettings() {
    this.#electronService
      .sendEvent<UserSettingModel[]>('user-settings')
      .pipe(
        tap(res => res && this.#userSettingService.setUserSetting(res.args)),
        switchMap(res => res && this.getServerMods(res.args)),
        concatAll(),
        takeUntilDestroyed()
      )
      .subscribe(value => {
        this.#ngZone.run(() => {
          value.userSetting.clientMods = value.clientMods.args;
          value.userSetting.serverMods = value.serverMods.args;

          this.#userSettingService.updateUserSetting();
        });
      });
  }

  private getServerMods(userSettings: UserSettingModel[]) {
    return userSettings.map(userSetting =>
      forkJoin({
        userSetting: of(userSetting),
        serverMods: this.#electronService.sendEvent<ModMeta[], string>('server-mod', userSetting.akiRootDirectory),
        clientMods: this.#electronService.sendEvent<ModMeta[], string>('client-mod', userSetting.akiRootDirectory),
      })
    );
  }
}

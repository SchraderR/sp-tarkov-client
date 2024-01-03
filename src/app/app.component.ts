import { ChangeDetectorRef, Component, inject, NgZone, ViewChild } from '@angular/core';
import { APP_CONFIG } from '../environments/environment';
import { RouterModule } from '@angular/router';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { CommonModule, NgOptimizedImage } from '@angular/common';
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

@Component({
  standalone: true,
  selector: 'app-root',
  providers: [ElectronService],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [
    MatButtonModule,
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatListModule,
    MatInputModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    NgOptimizedImage,
    ModSearchComponent,
    MatBadgeModule,
  ],
})
export class AppComponent {
  #matIconRegistry = inject(MatIconRegistry);
  #electronService = inject(ElectronService, { self: true });
  #userSettingService = inject(UserSettingsService);
  #modListService = inject(ModListService);
  #ngZone = inject(NgZone);
  #changeDetectorRef = inject(ChangeDetectorRef);

  @ViewChild(MatDrawer, { static: true }) matDrawer!: MatDrawer;

  modListSignal = this.#modListService.modListSignal;

  constructor() {
    // TODO Maybe Routen End Event Close Dialog
    console.log('APP_CONFIG', APP_CONFIG);

    this.#matIconRegistry.setDefaultFontSetClass('material-symbols-outlined');
    this.getCurrentPersonalSettings();
  }

  toggleDrawer() {
    void this.matDrawer.toggle();
  }

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
        serverMods: this.#electronService.sendEvent<ModMeta[]>('server-mod', userSetting.akiRootDirectory),
        clientMods: this.#electronService.sendEvent<ModMeta[]>('client-mod', userSetting.akiRootDirectory),
      })
    );
  }
}

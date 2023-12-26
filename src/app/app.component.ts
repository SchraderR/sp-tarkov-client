import { Component, inject, ViewChild, ViewEncapsulation } from '@angular/core';
import { APP_CONFIG } from '../environments/environment';
import { RouterModule } from '@angular/router';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { ElectronService } from './core/services/electron.service';
import { UserSettingModel } from '../../shared/models/user-setting.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UserSettingsService } from './core/services/user-settings.service';
import { MatInputModule } from '@angular/material/input';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { debounceTime, filter, Observable, startWith, switchMap } from 'rxjs';
import { AkiSearchService } from './core/services/aki-search.service';

export interface ModSearchItem {
  modName: string;
  modImage: string;
  modFileUrl: string;
  modKind: string;
}

@Component({
  standalone: true,
  selector: 'app-root',
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
  ],
})
export class AppComponent {
  #matIconRegistry = inject(MatIconRegistry);
  #electronService = inject(ElectronService);
  #userSettingService = inject(UserSettingsService);
  #akiSearchService = inject(AkiSearchService);

  @ViewChild(MatDrawer, { static: true }) matDrawer!: MatDrawer;

  searchControl = new FormControl('', [Validators.required]);
  filteredStates: Observable<ModSearchItem[]>;

  constructor() {
    // TODO Maybe Routen End Event Close Dialog
    console.log('APP_CONFIG', APP_CONFIG);

    this.#matIconRegistry.setDefaultFontSetClass('material-symbols-outlined');
    this.getCurrentPersonalSettings();

    this.filteredStates = this.searchControl.valueChanges.pipe(
      startWith(''),
      debounceTime(500),
      filter(value => !!value),
      switchMap(searchArgument => this.#akiSearchService.searchMods(searchArgument!))
    );
  }

  toggleDrawer() {
    void this.matDrawer.toggle();
  }

  private getCurrentPersonalSettings() {
    this.#electronService
      .sendEvent<UserSettingModel[]>('user-settings')
      .pipe(takeUntilDestroyed())
      .subscribe(res => this.#userSettingService.setUserSetting(res!.args));
  }
}

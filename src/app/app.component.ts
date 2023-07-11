import { Component, inject, ViewChild } from '@angular/core';
import { APP_CONFIG } from '../environments/environment';
import { RouterModule } from '@angular/router';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule, MatIconRegistry } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { ElectronService } from './core/services/electron.service';

@Component({
  standalone: true,
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  imports: [MatButtonModule, CommonModule, RouterModule, MatSidenavModule, MatToolbarModule, MatIconModule, MatListModule],
})
export class AppComponent {
  #matIconRegistry = inject(MatIconRegistry);
  #electronService = inject(ElectronService);

  @ViewChild(MatDrawer, { static: true }) matDrawer!: MatDrawer;

  constructor() {
    // TODO Maybe Routen End Event Close Dialog
    console.log('APP_CONFIG', APP_CONFIG);
    this.#matIconRegistry.setDefaultFontSetClass('material-symbols-outlined');

    if (this.#electronService.isElectron) {
      console.log(process.env);
      console.log('Run in electron');
      console.log('Electron ipcRenderer', this.#electronService.ipcRenderer);
      console.log('NodeJS childProcess', this.#electronService.childProcess);
    } else {
      console.log('Run in browser');
    }
  }

  toggleDrawer() {
    void this.matDrawer.toggle();
  }
}

import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgForOf, NgIf, NgOptimizedImage } from '@angular/common';
import { ModCardComponent } from '../mod-card/mod-card.component';
import { ModListService } from '../../core/services/mod-list.service';
import { Mod } from '../../core/models/mod';
import { DownloadService } from '../../core/services/download.service';

@Component({
  standalone: true,
  selector: 'app-mod-list',
  imports: [MatButtonModule, MatCardModule, MatIconModule, MatTooltipModule, NgForOf, NgOptimizedImage, ModCardComponent, NgIf],
  templateUrl: './mod-list.component.html',
  styleUrl: './mod-list.component.scss',
})
export default class ModListComponent {
  #modListService = inject(ModListService);
  #downloadService = inject(DownloadService);

  modListSignal = this.#modListService.modListSignal;

  downloadAndInstall = () => this.#downloadService.downloadAndInstall();

  removeMod(mod: Mod) {
    this.#modListService.removeMod(mod.name);
  }
}

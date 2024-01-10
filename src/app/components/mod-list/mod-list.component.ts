import { ChangeDetectorRef, Component, computed, inject, NgZone } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { ModCardComponent } from '../mod-card/mod-card.component';
import { ModListService } from '../../core/services/mod-list.service';
import { Mod } from '../../core/models/mod';
import { DownloadService } from '../../core/services/download.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fadeInFadeOutAnimation } from '../mod-card/mod-card.animations';

@Component({
  standalone: true,
  selector: 'app-mod-list',
  templateUrl: './mod-list.component.html',
  styleUrl: './mod-list.component.scss',
  imports: [CommonModule, MatButtonModule, MatCardModule, MatIconModule, MatTooltipModule, NgOptimizedImage, ModCardComponent],
  animations: [fadeInFadeOutAnimation]
})
export default class ModListComponent {
  #modListService = inject(ModListService);
  #downloadService = inject(DownloadService);
  ngZone = inject(NgZone);
  changeDetectorRef = inject(ChangeDetectorRef);

  modListSignal = this.#modListService.modListSignal;
  isModNotCompleted = computed(() => this.modListSignal().some(m => !m.installProgress?.completed));
  isDownloadingAndInstalling$ = this.#downloadService.isDownloadAndInstallInProgress;

  constructor() {
    this.#downloadService.downloadProgressEvent.pipe(takeUntilDestroyed()).subscribe(() => {
      this.ngZone.run(() => this.changeDetectorRef.markForCheck());
    });
  }

  downloadAndInstall = () => this.#downloadService.downloadAndInstall();

  removeMod(mod: Mod) {
    this.#modListService.removeMod(mod.name);
  }
}

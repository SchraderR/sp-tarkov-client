import { ChangeDetectorRef, Component, computed, inject, NgZone, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';
import { ModCardComponent } from '../mod-card/mod-card.component';
import { ModListService } from '../../core/services/mod-list.service';
import { Mod } from '../../core/models/mod';
import { DownloadService } from '../../core/services/download.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fadeInFadeOutAnimation } from '../../core/animations/fade-in-out.animation';
import { JoyrideModule } from 'ngx-joyride';
import { firstValueFrom } from 'rxjs';
import { ElectronService } from '../../core/services/electron.service';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ReactiveFormsModule } from '@angular/forms';
import { ModDependencyCardComponent } from '../mod-dependency-card/mod-dependency-card.component';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

@Component({
  standalone: true,
  selector: 'app-mod-list',
  templateUrl: './mod-list.component.html',
  styleUrl: './mod-list.component.scss',
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatTooltipModule,
    ModCardComponent,
    JoyrideModule,
    MatSlideToggleModule,
    ReactiveFormsModule,
    ModDependencyCardComponent,
    MatProgressSpinner,
  ],
  animations: [fadeInFadeOutAnimation],
})
export default class ModListComponent implements OnInit {
  #modListService = inject(ModListService);
  #downloadService = inject(DownloadService);
  #electronService = inject(ElectronService);
  #ngZone = inject(NgZone);
  #changeDetectorRef = inject(ChangeDetectorRef);

  modListSignal = this.#modListService.modListSignal;
  isModNotCompleted = computed(() => this.modListSignal().some(m => !m.installProgress?.completed));
  isModCompleted = computed(() => this.modListSignal().some(m => m.installProgress?.completed));
  isSomeModDependencyLoading = computed(() => this.modListSignal().some(m => m.isDependenciesLoading));

  emote = '';
  isDownloadingAndInstalling$ = this.#downloadService.isDownloadAndInstallInProgress;

  constructor() {
    this.#downloadService.downloadProgressEvent
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.#ngZone.run(() => this.#changeDetectorRef.markForCheck()));
  }

  ngOnInit() {
    this.selectRandomEmote();
  }

  downloadAndInstallAll = () => this.#downloadService.downloadAndInstallAll();

  async removeMod(mod: Mod) {
    this.#modListService.removeMod(mod.name);
    await firstValueFrom(this.#electronService.sendEvent('remove-mod-list-cache', mod.name));
  }

  removeCompletedMods() {
    this.#modListService.removeCompletedMods();
  }

  private selectRandomEmote() {
    const emotes = [
      '乁( ͡° ͜ʖ ͡°)ㄏ',
      '¯\\_( ͠° ͟ʖ ͠°)_/¯',
      '乁( ⁰͡ Ĺ̯ ⁰͡ ) ㄏ',
      '¯\\_( ◉ 3 ◉ )_/¯',
      '¯\\_(⊙︿⊙)_/¯',
      '¯\\_(ツ)_/¯',
      '¯\\_〳 •̀ o •́ 〵_/¯',
      '¯\\_( ͡ᵔ ͜ʖ ͡ᵔ )_/¯',
      '¯\\_(° ͜ʖ °)_/¯',
      '乁( ͡° ͜ʖ ͡ °)ㄏ',
      '┐( ͡◉ ͜ʖ ͡◉)┌',
      '¯\\_(⊙_ʖ⊙)_/¯',
    ];
    this.emote = emotes[Math.floor(Math.random() * emotes.length)];
  }
}

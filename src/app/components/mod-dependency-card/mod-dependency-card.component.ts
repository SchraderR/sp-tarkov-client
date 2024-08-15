import { Component, inject, Input } from '@angular/core';
import { Mod } from '../../core/models/mod';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ElectronService } from '../../core/services/electron.service';
import { NgOptimizedImage } from '@angular/common';
import { MatIconButton } from '@angular/material/button';
import { MatProgressBar } from '@angular/material/progress-bar';
import { fadeInFadeOutAnimation } from '../../core/animations/fade-in-out.animation';

@Component({
  selector: 'app-mod-dependency-card',
  standalone: true,
  imports: [MatCard, MatCardContent, MatIconModule, NgOptimizedImage, MatIconButton, MatProgressBar],
  templateUrl: './mod-dependency-card.component.html',
  styleUrls: ['./mod-dependency-card.component.scss', './../mod-card/mod-card.component.scss'],
  animations: [fadeInFadeOutAnimation],
})
export class ModDependencyCardComponent {
  #electronService = inject(ElectronService);

  @Input({ required: true }) mod!: Mod;

  hovering = false;

  openExternal(fileUrl: string) {
    this.#electronService.openExternal(fileUrl);
  }
}

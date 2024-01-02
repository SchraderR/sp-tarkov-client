import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { NgIf, NgOptimizedImage } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { fadeInFadeOutAnimation } from './mod-card.animations';
import { MatRippleModule } from '@angular/material/core';
import { Mod } from '../../core/models/mod';

@Component({
  selector: 'app-mod-card',
  standalone: true,
  imports: [MatCardModule, NgOptimizedImage, MatButtonModule, MatProgressBarModule, MatTooltipModule, NgIf, MatIconModule, MatRippleModule],
  templateUrl: './mod-card.component.html',
  styleUrl: './mod-card.component.scss',
  animations: [fadeInFadeOutAnimation],
})
export class ModCardComponent {
  @Input({ required: true }) mod!: Mod;
  @Output() removeModEvent = new EventEmitter<Mod>();

  hovering = false;

  removeModFromModList = (modDownloadItem: Mod) => this.removeModEvent.emit(modDownloadItem);
}

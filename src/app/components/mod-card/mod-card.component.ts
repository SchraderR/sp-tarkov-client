import { Component, inject, Input } from '@angular/core';
import { ModItem, ModListService } from '../../core/services/mod-list.service';
import { MatCardModule } from '@angular/material/card';
import { NgIf, NgOptimizedImage } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { fadeInFadeOutAnimation } from './mod-card.animations';
import { MatRippleModule } from '@angular/material/core';

export interface ModItemDownloadProgress extends ModItem, ModDownloadProgress {
  downloadLinkProgress: number;
  unzipProgress: number;
  downloadLinkStart: boolean;
  unzipStart: boolean;
  downloadLinkError: boolean;
  downloadModError: boolean;
  unzipError: boolean;
}

export interface ModDownloadProgress {
  percent: number;
  totalBytes: string;
  transferredBytes: string;
}

@Component({
  selector: 'app-mod-card',
  standalone: true,
  imports: [MatCardModule, NgOptimizedImage, MatButtonModule, MatProgressBarModule, MatTooltipModule, NgIf, MatIconModule, MatRippleModule],
  templateUrl: './mod-card.component.html',
  styleUrl: './mod-card.component.scss',
  animations: [fadeInFadeOutAnimation],
})
export class ModCardComponent {
  #modListService = inject(ModListService);

  @Input({ required: true }) modDownloadItem!: ModItemDownloadProgress;
  hovering = false;

  removeModFromModList = (modDownloadItem: ModItemDownloadProgress) => this.#modListService.deleteModToModList(modDownloadItem.modName);
}

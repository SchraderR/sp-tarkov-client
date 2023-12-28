import { Component, Input } from '@angular/core';
import { ModItem } from '../../core/services/mod-list.service';
import { MatCardModule } from '@angular/material/card';
import { NgOptimizedImage } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface ModItemDownloadProgress extends ModItem, ModDownloadProgress {
  downloadLinkProgress: number;
  unzipProgress: number;
  downloadLinkError: boolean
  downloadModError: boolean
  unzipError: boolean
}

export interface ModDownloadProgress {
  percent: number;
  totalBytes: string;
  transferredBytes: string;
}

@Component({
  selector: 'app-mod-card',
  standalone: true,
  imports: [MatCardModule, NgOptimizedImage, MatButtonModule, MatProgressBarModule, MatTooltipModule],
  templateUrl: './mod-card.component.html',
  styleUrl: './mod-card.component.scss',
})
export class ModCardComponent {
  @Input({ required: true }) modItemDownloadProgress!: ModItemDownloadProgress;
}

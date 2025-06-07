import { Component, inject, OnInit, input, output } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { Mod } from '../../core/models/mod';
import { Observable } from 'rxjs';
import { ElectronService } from '../../core/services/electron.service';
import { fadeInFadeOutAnimation } from '../../core/animations/fade-in-out.animation';
import { DownloadService } from '../../core/services/download.service';
import { ImagePathResolverPipe } from '../../core/pipes/image-path-resolver.pipe';

export interface ModLicenseInformation {
  url: string;
  text: string;
}

@Component({
  selector: 'app-mod-card',
  templateUrl: './mod-card.component.html',
  styleUrl: './mod-card.component.scss',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatIconModule,
    MatRippleModule,
    ImagePathResolverPipe,
    NgOptimizedImage,
  ],
  animations: [fadeInFadeOutAnimation],
})
export class ModCardComponent implements OnInit {
  private electronService = inject(ElectronService);
  private downloadService = inject(DownloadService);

  readonly mod = input.required<Mod>();
  readonly removeModEvent = output<Mod>();

  hovering = false;
  modLicenseInformation$: Observable<ModLicenseInformation> | null = null;
  isDownloadingAndInstalling$ = this.downloadService.isDownloadAndInstallInProgress;

  ngOnInit() {}

  removeModFromModList = (modDownloadItem: Mod) => this.removeModEvent.emit(modDownloadItem);
  openExternal = (licenseUrl: string) => void this.electronService.openExternal(licenseUrl);
}

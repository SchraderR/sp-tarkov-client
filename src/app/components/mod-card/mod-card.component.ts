import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { fadeInFadeOutAnimation } from './mod-card.animations';
import { MatRippleModule } from '@angular/material/core';
import { Mod } from '../../core/models/mod';
import { HttpClient } from '@angular/common/http';
import { HtmlHelper } from '../../core/helper/html-helper';
import { EMPTY, map, Observable } from 'rxjs';
import { ElectronService } from '../../core/services/electron.service';

export interface ModLicenseInformation {
  url: string;
  text: string;
}

@Component({
  standalone: true,
  selector: 'app-mod-card',
  templateUrl: './mod-card.component.html',
  styleUrl: './mod-card.component.scss',
  imports: [CommonModule, MatCardModule, NgOptimizedImage, MatButtonModule, MatProgressBarModule, MatTooltipModule, MatIconModule, MatRippleModule],
  animations: [fadeInFadeOutAnimation],
})
export class ModCardComponent implements OnInit {
  #httpClient = inject(HttpClient);
  #electronService = inject(ElectronService);

  @Input({ required: true }) mod!: Mod;
  @Output() removeModEvent = new EventEmitter<Mod>();

  hovering = false;
  modLicenseInformation$: Observable<ModLicenseInformation> | null = null;

  ngOnInit() {
    this.modLicenseInformation$ = this.getModLicenseInformation();
  }

  removeModFromModList = (modDownloadItem: Mod) => this.removeModEvent.emit(modDownloadItem);
  openExternal = (licenseUrl: string) => void this.#electronService.shell.openExternal(licenseUrl);

  private getModLicenseInformation(): Observable<ModLicenseInformation> {
    if (!this.mod?.fileUrl) {
      return EMPTY;
    }

    return this.#httpClient.get(this.mod.fileUrl, { responseType: 'text' }).pipe(
      map(modHtml => {
        const modPageView = HtmlHelper.parseStringAsHtml(modHtml);
        const modLicenceBox = modPageView.body.querySelector('.boxContent dl dd:first-of-type a');

        return {
          url: modLicenceBox?.getAttribute('href') ?? this.mod.fileUrl,
          text: modLicenceBox?.innerHTML ?? 'SP Hub-License',
        };
      })
    );
  }
}

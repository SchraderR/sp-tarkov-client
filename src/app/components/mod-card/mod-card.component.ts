import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { Mod } from '../../core/models/mod';
import { HttpClient } from '@angular/common/http';
import { HtmlHelper } from '../../core/helper/html-helper';
import { EMPTY, map } from 'rxjs';
import { ElectronService } from '../../core/services/electron.service';
import { fadeInFadeOutAnimation } from '../../core/animations/fade-in-out.animation';
import { DownloadService } from '../../core/services/download.service';
import { ModListService } from '../../core/services/mod-list.service';
import { environment } from '../../../environments/environment';

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
  #downloadService = inject(DownloadService);
  #modListService = inject(ModListService);

  @Input({ required: true }) mod!: Mod;
  @Output() removeModEvent = new EventEmitter<Mod>();

  hovering = false;

  ngOnInit() {
    this.getModInformation().subscribe();
  }

  removeModFromModList = (modDownloadItem: Mod) => this.removeModEvent.emit(modDownloadItem);
  openExternal = (licenseUrl: string) => void this.#electronService.openExternal(licenseUrl);

  downloadAndInstallSingle = async (mod: Mod) => await this.#downloadService.downloadAndInstallSingle(mod);

  private getModInformation() {
    if (!this.mod?.fileUrl) {
      return EMPTY;
    }
    let path = this.mod.fileUrl;

    if (!environment.production) {
      path = this.mod.fileUrl.split('https://hub.sp-tarkov.com/')[1];
    }

    return this.#httpClient.get(path, { responseType: 'text' }).pipe(
      map(modHtml => {
        const modPageView = HtmlHelper.parseStringAsHtml(modHtml);
        const modLicenceBox = modPageView.body.querySelector('.boxContent dl dd:first-of-type a');

        this.mod.licenseUrl = modLicenceBox?.getAttribute('href') ?? this.mod.fileUrl;
        this.mod.license = modLicenceBox?.innerHTML ?? 'SP Hub-License';
        this.mod.lastVersion = modPageView.body.getElementsByClassName('filebaseVersionNumber')[0].innerHTML ?? "";

        if (this.mod.lastVersion !== this.mod.downloadVersion && this.mod.lastUpdate && this.mod.downloadDate && this.mod.lastUpdate > this.mod.downloadDate) {
          this.mod.installProgress = this.#modListService.initialInstallProgress();
        }
      })
    );
  }
}

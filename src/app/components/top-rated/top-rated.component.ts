import { Component, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { HtmlHelper } from '../../core/helper/html-helper';
import { MatCardModule } from '@angular/material/card';
import { NgForOf, NgOptimizedImage } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { ElectronService } from '../../core/services/electron.service';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface ModListItem {
  modFileUrl: string;
  modName: string;
  modIcon: string;
}

@Component({
  standalone: true,
  selector: 'app-top-rated',
  templateUrl: './top-rated.component.html',
  styleUrls: ['./top-rated.component.scss'],
  imports: [MatCardModule, NgForOf, MatButtonModule, MatIconModule, RouterLink, MatTooltipModule, NgOptimizedImage],
})
export default class TopRatedComponent {
  #restrictedMods = ['SPT-AKI', 'SPT-AKI-INSTALLER', 'AKI Patcher'];
  #httpClient = inject(HttpClient);
  #electronService = inject(ElectronService);
  #placeholderImagePath = 'assets/images/placeholder.png';

  accumulatedModList: ModListItem[] = [];

  constructor() {
    this.#httpClient
      .get('https://hub.sp-tarkov.com/files?pageNo=1&sortField=cumulativeLikes&sortOrder=DESC', { responseType: 'text' })
      .pipe(takeUntilDestroyed())
      .subscribe(pestRatedViewString => {
        const topRatedView = HtmlHelper.parseStringAsHtml(pestRatedViewString);
        const modList = topRatedView.body.getElementsByClassName('filebaseFileCard');

        this.accumulatedModList = Array.from(modList)
          .map(e => ({
            modName: e.getElementsByClassName('filebaseFileSubject')[0].getElementsByTagName('span')[0].innerHTML,
            modFileUrl: e.getElementsByTagName('a')[0].href,
            modIcon: e.getElementsByClassName('filebaseFileIcon')[0]?.getElementsByTagName('img')[0]?.src ?? this.#placeholderImagePath,
          }))
          .filter(e => this.filterCoreMods(e));

        console.log(this.accumulatedModList);
      });
  }

  openExternal(modFileUrl: string) {
    void this.#electronService.shell.openExternal(modFileUrl);
  }

  private filterCoreMods(e: ModListItem) {
    return !this.#restrictedMods.includes(e.modName);
  }
}

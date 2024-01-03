import { Component, inject } from '@angular/core';
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
import { ModListService } from '../../core/services/mod-list.service';
import { Mod } from '../../core/models/mod';
import { IsAlreadyInstalledDirective } from '../../core/directives/is-already-installed.directive';

@Component({
  standalone: true,
  selector: 'app-top-rated',
  templateUrl: './top-rated.component.html',
  styleUrls: ['./top-rated.component.scss'],
  imports: [MatCardModule, NgForOf, MatButtonModule, MatIconModule, RouterLink, MatTooltipModule, NgOptimizedImage, IsAlreadyInstalledDirective],
})
export default class TopRatedComponent {
  #restrictedMods = ['SPT-AKI', 'SPT-AKI-INSTALLER', 'AKI Patcher'];
  #httpClient = inject(HttpClient);
  #electronService = inject(ElectronService);
  #modListService = inject(ModListService);
  #placeholderImagePath = 'assets/images/placeholder.png';

  accumulatedModList: Mod[] = [];

  modListSignal = this.#modListService.modListSignal;
  isInModList = (modName: string) => this.modListSignal().some(m => m.name === modName);

  constructor() {
    this.#httpClient
      .get('https://hub.sp-tarkov.com/files?pageNo=1&sortField=cumulativeLikes&sortOrder=DESC', { responseType: 'text' })
      .pipe(takeUntilDestroyed())
      .subscribe(pestRatedViewString => {
        const topRatedView = HtmlHelper.parseStringAsHtml(pestRatedViewString);
        const modList = topRatedView.body.getElementsByClassName('filebaseFileCard');

        this.accumulatedModList = Array.from(modList)
          .map(
            e =>
              ({
                name: e.getElementsByClassName('filebaseFileSubject')[0].getElementsByTagName('span')[0].innerHTML,
                fileUrl: e.getElementsByTagName('a')[0].href,
                image: e.getElementsByClassName('filebaseFileIcon')[0]?.getElementsByTagName('img')[0]?.src ?? this.#placeholderImagePath,
                kind: '',
              }) as Mod
          )
          .filter(e => this.filterCoreMods(e));

        console.log(this.accumulatedModList);
      });
  }

  addModToModList(mod: Mod) {
    this.#modListService.addMod(mod);
  }

  removeModFromModList(mod: Mod) {
    this.#modListService.removeMod(mod.name);
  }

  openExternal(modFileUrl: string) {
    void this.#electronService.shell.openExternal(modFileUrl);
  }

  private filterCoreMods(mod: Mod) {
    return !this.#restrictedMods.includes(mod.name);
  }
}

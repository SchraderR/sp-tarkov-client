import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ElectronService } from '../../core/services/electron.service';
import { ModListService } from '../../core/services/mod-list.service';
import { UserSettingsService } from '../../core/services/user-settings.service';
import { Mod } from '../../core/models/mod';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HtmlHelper } from '../../core/helper/html-helper';
import { MatCardModule } from '@angular/material/card';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { IsAlreadyInstalledDirective } from '../../core/directives/is-already-installed.directive';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { restrictedModList } from '../../constants';

@Component({
  standalone: true,
  selector: 'app-new-mods',
  templateUrl: './new-mods.component.html',
  styleUrl: './new-mods.component.scss',
  imports: [CommonModule, MatCardModule, NgOptimizedImage, IsAlreadyInstalledDirective, MatIconModule, MatTooltipModule, MatButtonModule],
})
export default class NewModsComponent {
  #httpClient = inject(HttpClient);
  #electronService = inject(ElectronService);
  #modListService = inject(ModListService);
  #userSettingsService = inject(UserSettingsService);

  accumulatedModList: Mod[] = [];

  isActiveAkiInstanceAvailable = () => !!this.#userSettingsService.getActiveInstance();

  constructor() {
    this.#httpClient
      .get('https://hub.sp-tarkov.com/files/?pageNo=1&sortField=time&sortOrder=DESC', { responseType: 'text' })
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
                image: e.getElementsByClassName('filebaseFileIcon')[0]?.getElementsByTagName('img')[0]?.src ?? null,
                icon: e.getElementsByClassName('filebaseFileIcon')[0]?.getElementsByTagName('span')[0]?.className.split('icon icon128')[1] ?? null,
                teaser: e.getElementsByClassName('filebaseFileTeaser')[0].innerHTML ?? '',
                kind: '',
              }) as Mod
          )
          .filter(e => this.filterCoreMods(e));
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
    return !restrictedModList.includes(mod.name);
  }
}

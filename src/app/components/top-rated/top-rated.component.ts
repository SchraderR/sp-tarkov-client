import { Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { HtmlHelper } from '../../core/helper/html-helper';
import { MatCardModule } from '@angular/material/card';

export interface ModListItem {
  modFileUrl: string;
  modName: string;
}

@Component({
  standalone: true,
  selector: 'app-top-rated',
  templateUrl: './top-rated.component.html',
  styleUrls: ['./top-rated.component.scss'],
  imports: [MatCardModule],
})
export default class TopRatedComponent {
  #httpClient = inject(HttpClient);
  accumulatedModList: ModListItem[] = [];

  constructor() {
    this.#httpClient
      .get('https://hub.sp-tarkov.com/files?pageNo=1&sortField=cumulativeLikes&sortOrder=DESC', { responseType: 'text' })
      .pipe(takeUntilDestroyed())
      .subscribe(pestRatedViewString => {
        const pestRatedView = HtmlHelper.parseStringAsHtml(pestRatedViewString);
        const modList = Array.from(pestRatedView.body.getElementsByClassName('filebaseFileCard'));
        this.accumulatedModList = Array.from(modList).map(e => ({
          modName: e.getElementsByClassName('filebaseFileSubject')[0].getElementsByTagName('span')[0].innerHTML,
          modFileUrl: e.getElementsByTagName('a')[0].href,
        }));
      });
  }
}

import { Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { HtmlHelper } from '../../core/helper/html-helper';

@Component({
  standalone: true,
  selector: 'app-top-rated',
  templateUrl: './top-rated.component.html',
  styleUrls: ['./top-rated.component.scss'],
})
export default class TopRatedComponent {
  // link https://hub.sp-tarkov.com/files/?pageNo=1&sortField=cumulativeLikes&sortOrder=DESC
  #httpClient = inject(HttpClient);

  constructor() {
    this.#httpClient
      .get('https://hub.sp-tarkov.com/files/?pageNo=1&sortField=cumulativeLikes&sortOrder=DESC', { responseType: 'text' })
      .pipe(takeUntilDestroyed())
      .subscribe(pestRatedViewString => {
        const pestRatedView = HtmlHelper.parseStringAsHtml(pestRatedViewString);
        console.log(pestRatedView);

        const tttt = pestRatedView.body.getElementsByClassName('filebaseFileSubject');
        Array.from(tttt).forEach( (element) => {
          console.log ( element );
          // do something with element
        });

      });
  }
}

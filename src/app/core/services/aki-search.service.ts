import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ModSearchItem } from '../../app.component';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { HtmlHelper } from '../helper/html-helper';

@Injectable({
  providedIn: 'root',
})
export class AkiSearchService {
  #httpClient = inject(HttpClient);
  modSearchUrl = 'https://hub.sp-tarkov.com/files/extended-search/';
  #placeholderImagePath = 'assets/images/placeholder.png';

  searchMods(searchArgument: string): Observable<ModSearchItem[]> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' });

    return this.#httpClient
      .post(this.modSearchUrl, `searchString=${searchArgument}&searchParameters[0][name]=types[]&searchParameters[0][value]=everywhere`, {
        headers: headers,
      })
      .pipe(map((response: any) => this.extractModInformation(response.template)));
  }

  private extractModInformation(htmlBody: string): ModSearchItem[] {
    const searchResult = HtmlHelper.parseStringAsHtml(htmlBody);
    const modListSection = searchResult.body
      ?.getElementsByClassName('section')?.[1]
      ?.querySelectorAll('div.sectionTitle + ul')?.[0]
      ?.getElementsByClassName('extendedNotificationItem');

    if (!modListSection) {
      return [];
    }

    return Array.from(modListSection).map(e => ({
      modName: e.getElementsByClassName('extendedNotificationLabel')?.[0]?.innerHTML,
      modImage: e.getElementsByTagName('img')?.[0]?.src ?? this.#placeholderImagePath,
      modFileUrl: e.getElementsByTagName('a')?.[0]?.href,
      modKind: e.getElementsByClassName('extendedNotificationSubtitle')?.[0].getElementsByTagName('small')?.[0].innerHTML,
    }));
  }
}

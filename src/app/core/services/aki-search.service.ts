import { inject, Injectable } from '@angular/core';
import { catchError, EMPTY, map, Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { HtmlHelper } from '../helper/html-helper';
import { Mod } from '../models/mod';

interface SearchResponse {
  template: string;
}

@Injectable({
  providedIn: 'root',
})
export class AkiSearchService {
  #httpClient = inject(HttpClient);
  modSearchUrl = 'https://hub.sp-tarkov.com/files/extended-search/';
  #placeholderImagePath = 'assets/images/placeholder.png';

  searchMods(searchArgument: string): Observable<Mod[]> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' });

    return this.#httpClient
      .post<SearchResponse>(this.modSearchUrl, `searchString=${searchArgument}&searchParameters[0][name]=types[]&searchParameters[0][value]=everywhere`, {
        headers: headers,
      })
      .pipe(
        map(response => this.extractModInformation(response)),
        catchError(() => EMPTY)
      );
  }

  private extractModInformation(searchResponse: SearchResponse): Mod[] {
    const searchResult = HtmlHelper.parseStringAsHtml(searchResponse.template);
    const modListSection = searchResult.body
      ?.getElementsByClassName('section')?.[1]
      ?.querySelectorAll('div.sectionTitle + ul')?.[0]
      ?.getElementsByClassName('extendedNotificationItem');

    if (!modListSection) {
      return [];
    }

    return Array.from(modListSection).map(e => ({
      name: e.getElementsByClassName('extendedNotificationLabel')?.[0]?.innerHTML,
      image: e.getElementsByTagName('img')?.[0]?.src ?? this.#placeholderImagePath,
      fileUrl: e.getElementsByTagName('a')?.[0]?.href,
      kind: e.getElementsByClassName('extendedNotificationSubtitle')?.[0].getElementsByTagName('small')?.[0].innerHTML,
    }));
  }
}

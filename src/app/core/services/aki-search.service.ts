import { inject, Injectable } from '@angular/core';
import { catchError, EMPTY, map, Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { HtmlHelper } from '../helper/html-helper';
import { Mod } from '../models/mod';
import { Kind } from '../../../../shared/models/unzip.model';

interface SearchResponse {
  template: string;
}

@Injectable({
  providedIn: 'root',
})
export class AkiSearchService {
  private restricted = ['Community support'];

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
    const modListSection = searchResult.body?.querySelectorAll('.section:nth-child(2) div.sectionTitle + ul .extendedNotificationItem');

    if (!modListSection) {
      return [];
    }

    return Array.from(modListSection)
      .map(e => {
        const rawKind = e.getElementsByClassName('extendedNotificationSubtitle')?.[0].getElementsByTagName('small')?.[0].innerHTML;
        let kind: Kind | undefined;
        if (rawKind.startsWith('Client mods')) {
          kind = Kind.client;
        } else if (rawKind.startsWith('Server mods')) {
          kind = Kind.server;
        } else if (rawKind.startsWith('Overhaul')) {
          kind = Kind.overhaul;
        }

        return {
          name: e.getElementsByClassName('extendedNotificationLabel')?.[0]?.innerHTML,
          image: e.getElementsByTagName('img')?.[0]?.src ?? this.#placeholderImagePath,
          fileUrl: e.getElementsByTagName('a')?.[0]?.href,
          kind: kind,
        } as Mod;  // Type assertion here
      })
      .filter(m => m.kind !== undefined && !this.restricted.some(r => m.kind?.includes(r)) );
  }
}

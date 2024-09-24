import { inject, Injectable } from '@angular/core';
import { catchError, concatMap, delay, from, map, mergeMap, Observable, of, toArray } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { HtmlHelper } from '../helper/html-helper';
import { Mod } from '../models/mod';
import { environment } from '../../../environments/environment';
import { FileHelper } from '../helper/file-helper';
import { ConfigurationService } from './configuration.service';

interface SearchResponse {
  template: string;
}

@Injectable({
  providedIn: 'root',
})
export class SptSearchService {
  private restrictedModKinds = ['Community support'];

  #httpClient = inject(HttpClient);
  #configurationService = inject(ConfigurationService);
  modSearchUrl = environment.production ? 'https://hub.sp-tarkov.com/files/extended-search/' : '/files/extended-search/';
  #placeholderImagePath = 'assets/images/placeholder.png';

  searchMods(searchArgument: string): Observable<Mod[]> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' });

    return this.#httpClient
      .post<SearchResponse>(
        this.modSearchUrl,
        `searchString=${searchArgument}&searchParameters[0][name]=types[]&searchParameters[0][value]=everywhere`,
        { headers: headers }
      )
      .pipe(
        map(response => this.extractModInformation(response)),
        mergeMap((mods: Mod[]) => from(mods).pipe(concatMap(mod => of(mod).pipe(delay(500))))),
        mergeMap(mod =>
          this.getFileHubView(mod.fileUrl).pipe(
            map(({ supportedSptVersion, sptVersionColorCode }) => ({
              ...mod,
              supportedSptVersion,
              sptVersionColorCode,
            }))
          )
        ),
        toArray()
      );
  }

  private extractModInformation(searchResponse: SearchResponse): Mod[] {
    const searchResult = HtmlHelper.parseStringAsHtml(searchResponse.template);
    const modListSection = searchResult.body?.querySelectorAll('.section:nth-child(2) div.sectionTitle + ul .extendedNotificationItem');
    const config = this.#configurationService.configSignal();

    if (!modListSection) {
      return [];
    }

    return Array.from(modListSection)
      .map(e => {
        return {
          name: e.getElementsByClassName('extendedNotificationLabel')?.[0]?.innerHTML,
          image: e.getElementsByTagName('img')?.[0]?.src ?? this.#placeholderImagePath,
          fileUrl: e.getElementsByTagName('a')?.[0]?.href,
          kind: e.getElementsByClassName('extendedNotificationSubtitle')?.[0].getElementsByTagName('small')?.[0].innerHTML,
        } as Mod; // Type assertion here
      })
      .filter(m => !this.restrictedModKinds.some(r => m.kind?.includes(r)))
      .map(e => {
        if (!config) {
          return e;
        }

        const fileId = FileHelper.extractHubIdFromUrl(e.fileUrl);
        if (!fileId) {
          return e;
        }

        if (environment.production) {
          e.notSupported = !!config.notSupported.find(f => f === +fileId);
        }

        return e;
      });
  }

  getFileHubView(modUrl: string): Observable<Mod> {
    const originalModUrl = modUrl;
    modUrl = environment.production ? modUrl : modUrl.replace('https://hub.sp-tarkov.com/', '');

    return this.#httpClient.get(modUrl, { responseType: 'text' }).pipe(
      map(modView => this.extractSPInformation(modView, originalModUrl)),
      catchError(() => {
        return of({
          supportedSptVersion: 'Error while fetching version. Use with caution.',
          sptVersionColorCode: 'badge label red',
        } as Mod);
      })
    );
  }

  private extractSPInformation(modHub: string, fileUrl: string): Mod {
    const htmlResult = HtmlHelper.parseStringAsHtml(modHub);

    return {
      name: htmlResult.getElementsByClassName('contentTitle')?.[0]?.getElementsByTagName('span')[0].innerHTML,
      fileUrl: fileUrl,
      image: htmlResult.getElementsByClassName('contentHeaderIcon')[0]?.getElementsByTagName('img')[0]?.src ?? null,
      icon: htmlResult.getElementsByClassName('contentHeaderIcon')[0]?.getElementsByTagName('span')[0]?.className.split('icon icon64')[1] ?? null,
      teaser: htmlResult.getElementsByClassName('filebaseFileTeaser')[0].innerHTML ?? '',
      modVersion: htmlResult.getElementsByClassName('filebaseVersionNumber')[0].innerHTML ?? '',
      supportedSptVersion: htmlResult.getElementsByClassName('labelList')[0]?.getElementsByClassName('badge label')[0]?.innerHTML ?? '',
      sptVersionColorCode: htmlResult.getElementsByClassName('labelList')[0]?.getElementsByClassName('badge label')[0]?.className,
      kind: '',
    } as Mod;
  }
}

import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { map, of, switchMap, tap } from 'rxjs';
import { HtmlHelper } from '../helper/html-helper';
import { AkiTag, AkiVersion } from '../../../../shared/models/aki-core.model';
import { ElectronService } from './electron.service';

export interface Configuration {
  alternativeModNames: { [key: string]: string };
  notSupported: number[];
}

@Injectable({
  providedIn: 'root',
})
export class ConfigurationService {
  #httpClient = inject(HttpClient);
  #electronService = inject(ElectronService);
  #config = signal<Configuration | null>(null);
  #version = signal<AkiVersion[]>([]);
  #tags = signal<AkiTag[] | null>([]);

  readonly configSignal = this.#config.asReadonly();
  readonly versionSignal = this.#version.asReadonly();
  readonly tagsSignal = this.#tags.asReadonly();

  getCurrentConfiguration() {
    return this.#httpClient.get<Configuration>(`${environment.githubConfigLink}/config.json`).pipe(tap(config => this.#config.set(config)));
  }

  getAkiVersion() {
    return this.#electronService.sendEvent<AkiVersion[]>('aki-versions').pipe(
      switchMap(akiVersions => {
        if (akiVersions?.args?.length) {
          this.#version.set(akiVersions.args);
          return of(void 0);
        }

        return this.#httpClient.get(`${environment.akiFileBaseLink}?cacheBust=${Date.now()}`, { responseType: 'text' }).pipe(
          map(text => this.handleAkiVersion(text)),
          switchMap(versionList => this.#electronService.sendEvent<AkiVersion[], AkiVersion[]>('aki-versions-save', versionList))
        );
      })
    );
  }

  getCurrentTags() {
    return this.#electronService.sendEvent<AkiTag[]>('aki-tags').pipe(
      switchMap(akiTags => {
        if (akiTags?.args?.length) {
          this.#tags.set(akiTags.args);
          return of(void 0);
        }

        return this.#httpClient
          .get(`${environment.akiFileTagBaseLink}1-quests/?objectType=com.woltlab.filebase.file&cacheBust=${Date.now()}`, { responseType: 'text' })
          .pipe(
            map(text => this.handleAkiTags(text)),
            switchMap(tagList => this.#electronService.sendEvent<AkiTag[], AkiTag[]>('aki-tags-save', tagList))
          );
      })
    );
  }

  private handleAkiVersion(modHub: string) {
    const searchResult = HtmlHelper.parseStringAsHtml(modHub);
    const versionItems = searchResult.querySelectorAll('ul.scrollableDropdownMenu li');
    const versionList: AkiVersion[] = [];

    versionItems.forEach(item => {
      const dataLabelId = item.getAttribute('data-label-id');
      const innerText = item.querySelector('span span.badge')?.innerHTML;

      if (!dataLabelId || !innerText) {
        return;
      }

      versionList.push({ dataLabelId, innerText });
    });

    this.#version.set(versionList);
    return versionList;
  }

  private handleAkiTags(modHub: string) {
    const searchResult = HtmlHelper.parseStringAsHtml(modHub);
    const tagItems = searchResult.querySelectorAll('.tagList a');
    const tagList: AkiTag[] = [];
    const regex = /\/tagged\/([\w-]*)\//;

    tagItems.forEach(item => {
      const innerHtmlText = item.innerHTML;
      const matches = regex.exec((item as HTMLAnchorElement).href);

      if (matches && matches[1]) {
        tagList.push({ innerText: innerHtmlText, tagPath: `/${matches[1]}/` });
      }
    });

    this.#tags.set(tagList);
    return tagList;
  }
}

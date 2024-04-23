import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { tap } from 'rxjs';
import { HtmlHelper } from '../helper/html-helper';

export interface Configuration {
  alternativeClientModNames: { [key: string]: string };
  alternativeServerModNames: { [key: string]: string };
  notSupported: number[];
}

export interface AkiVersion {
  dataLabelId: string;
  innerText: string;
}

export interface AkiTag {
  tagPath: string;
  innerText: string;
}

@Injectable({
  providedIn: 'root',
})
export class ConfigurationService {
  #httpClient = inject(HttpClient);
  #config = signal<Configuration | null>(null);
  #version = signal<AkiVersion[]>([]);
  #tags = signal<AkiTag[] | null>([]);

  readonly configSignal = this.#config.asReadonly();
  readonly versionSignal = this.#version.asReadonly();
  readonly tagsSignal = this.#tags.asReadonly();

  getCurrentConfiguration() {
    return this.#httpClient.get<Configuration>(`${environment.githubConfigLink}/config.json`).pipe(tap(config => this.#config.set(config)));
  }

  getCurrentTags() {
    return this.#httpClient
      .get(`${environment.akiFileBaseLink}`, { responseType: 'text' })
      .pipe(tap(text => this.extractAndSaveAkiVersionAndTags(text)));
  }

  private extractAndSaveAkiVersionAndTags(modHub: string): void {
    const searchResult = HtmlHelper.parseStringAsHtml(modHub);

    this.handleAkiVersion(searchResult);
    this.handleAkiTags(searchResult);
  }

  private handleAkiVersion(searchResult: Document) {
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
  }

  private handleAkiTags(searchResult: Document) {
    const tagItems = searchResult.querySelectorAll('.tagList a');
    const tagList: AkiTag[] = [];
    const regex = /\/tagged\/([\w-]*)\//;

    tagItems.forEach(item => {
      let innerHtmlText = item.innerHTML;
      let matches = regex.exec((item as HTMLAnchorElement).href);

      if (matches && matches[1]) {
        tagList.push({ innerText: innerHtmlText, tagPath: `/${matches[1]}/` });
      }
    });

    this.#tags.set(tagList);
  }
}

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

@Injectable({
  providedIn: 'root',
})
export class ConfigurationService {
  #httpClient = inject(HttpClient);
  #config = signal<Configuration | null>(null);
  #version = signal<AkiVersion[]>([]);
  #tags = signal<Configuration | null>(null);

  readonly configSignal = this.#config.asReadonly();
  readonly versionSignal = this.#version.asReadonly();
  readonly tagsSignal = this.#tags.asReadonly();

  getCurrentConfiguration() {
    return this.#httpClient.get<Configuration>(`${environment.githubConfigLink}/config.json`).pipe(tap(config => this.#config.set(config)));
  }

  getCurrentTags() {
    return this.#httpClient.get(`${environment.akiFileBaseLink}`, { responseType: 'text' }).pipe(tap(text => this.extractAndSaveAkiVersion(text)));
  }

  private extractAndSaveAkiVersion(modHub: string): void {
    const searchResult = HtmlHelper.parseStringAsHtml(modHub);
    const listItems = searchResult.querySelectorAll('ul.scrollableDropdownMenu li');
    const dataList: AkiVersion[] = [];

    listItems.forEach(item => {
      const dataLabelId = item.getAttribute('data-label-id');
      const innerText = item.querySelector('span span.badge')?.innerHTML;

      if (!dataLabelId || !innerText) {
        return;
      }

      dataList.push({ dataLabelId, innerText });
    });

    this.#version.set(dataList);
  }
}

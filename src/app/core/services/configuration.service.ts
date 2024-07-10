import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { map, of, switchMap, tap } from 'rxjs';
import { HtmlHelper } from '../helper/html-helper';
import { SptTag, SptVersion } from '../../../../shared/models/spt-core.model';
import { ElectronService } from './electron.service';

export interface Configuration {
  alternativeClientModNames: { [key: string]: string };
  alternativeServerModNames: { [key: string]: string };
  notSupported: number[];
}

@Injectable({
  providedIn: 'root',
})
export class ConfigurationService {
  #httpClient = inject(HttpClient);
  #electronService = inject(ElectronService);
  #config = signal<Configuration | null>(null);
  #version = signal<SptVersion[]>([]);
  #tags = signal<SptTag[] | null>([]);

  readonly configSignal = this.#config.asReadonly();
  readonly versionSignal = this.#version.asReadonly();
  readonly tagsSignal = this.#tags.asReadonly();

  getCurrentConfiguration() {
    return this.#httpClient.get<Configuration>(`${environment.githubConfigLink}/config.json`).pipe(tap(config => this.#config.set(config)));
  }

  getSptVersion() {
    return this.#electronService.sendEvent<SptVersion[]>('spt-versions').pipe(
      switchMap(sptVersions => {
        if (sptVersions?.args?.length) {
          this.#version.set(sptVersions.args);
          return of(void 0);
        }

        return this.#httpClient.get(`${environment.sptFileBaseLink}?cacheBust=${Date.now()}`, { responseType: 'text' }).pipe(
          map(text => this.handleSptVersion(text)),
          switchMap(versionList => this.#electronService.sendEvent<SptVersion[], SptVersion[]>('spt-versions-save', versionList))
        );
      })
    );
  }

  getCurrentTags() {
    return this.#electronService.sendEvent<SptTag[]>('spt-tags').pipe(
      switchMap(sptTags => {
        if (sptTags?.args?.length) {
          this.#tags.set(sptTags.args);
          return of(void 0);
        }

        return this.#httpClient
          .get(`${environment.sptFileTagBaseLink}1-quests/?objectType=com.woltlab.filebase.file&cacheBust=${Date.now()}`, { responseType: 'text' })
          .pipe(
            map(text => this.handleSptTags(text)),
            switchMap(tagList => this.#electronService.sendEvent<SptTag[], SptTag[]>('spt-tags-save', tagList))
          );
      })
    );
  }

  private handleSptVersion(modHub: string) {
    const searchResult = HtmlHelper.parseStringAsHtml(modHub);
    const versionItems = searchResult.querySelectorAll('ul.scrollableDropdownMenu li');
    const versionList: SptVersion[] = [];

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

  private handleSptTags(modHub: string) {
    const searchResult = HtmlHelper.parseStringAsHtml(modHub);
    const tagItems = searchResult.querySelectorAll('.tagList a');
    const tagList: SptTag[] = [];
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

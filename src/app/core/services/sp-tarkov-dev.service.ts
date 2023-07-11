import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SpTarkovRelease } from '../models/sp-tarkov-release.model';

@Injectable({
  providedIn: 'root',
})
export class SpTarkovDevService {
  #httpClient = inject(HttpClient);
  private readonly spTarkovDevUrl = 'https://dev.sp-tarkov.com/api/v1/repos/SPT-AKI/Stable-Releases/releases/';

  getLatestRelease() {
    return this.#httpClient.get<SpTarkovRelease[]>(this.spTarkovDevUrl);
  }
}

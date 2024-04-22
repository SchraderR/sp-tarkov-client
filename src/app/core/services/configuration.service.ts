import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { tap } from 'rxjs';

export interface Configuration {
  alternativeClientModNames: { [key: string]: string };
  alternativeServerModNames: { [key: string]: string };
}

@Injectable({
  providedIn: 'root',
})
export class ConfigurationService {
  #httpClient = inject(HttpClient);
  #config = signal<Configuration | null>(null);
  readonly configSignal = this.#config.asReadonly();

  getCurrentConfiguration() {
    return this.#httpClient.get<Configuration>(`${environment.githubConfigLink}/config.json`).pipe(tap(config => this.#config.set(config)));
  }
}

import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { EMPTY, of, tap } from 'rxjs';
import { SptTag, SptVersion } from '../../../../shared/models/spt-core.model';
import { ForgeApiService } from './forge-api.service';

export interface ModDependency {
  hubId: number;
  dependencies: string[];
}

export interface Configuration {
  isSptHubModsJsonDisabled: boolean;
  alternativeModNames: { [key: string]: string };
  notSupported: number[];
  restrictedMods: string[];
  modDependency: ModDependency[];
}

@Injectable({
  providedIn: 'root',
})
export class ConfigurationService {
  private httpClient = inject(HttpClient);
  private forgeApiService = inject(ForgeApiService);
  private config = signal<Configuration | null>(null);
  private sptVersions = signal<SptVersion[]>([]);
  private tags = signal<SptTag[] | null>([]);

  readonly configSignal = this.config.asReadonly();
  readonly sptVersionSignal = this.sptVersions.asReadonly();
  readonly tagsSignal = this.tags.asReadonly();

  getCurrentConfiguration() {
    return this.httpClient
      .get<Configuration>(`${environment.githubConfigLink}/config.json?cacheBust=${Date.now()}`)
      .pipe(tap(config => this.config.set(config)));
  }

  getSptVersion() {
    return this.forgeApiService.getSptVersions().pipe(tap(sptVersions => this.sptVersions.set(sptVersions.data)));
  }

  getCurrentTags() {
    // TODOD Implement when TAGs api is available
    return of([]);
  }
}

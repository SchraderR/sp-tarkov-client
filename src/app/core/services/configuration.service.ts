import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { of, tap } from 'rxjs';
import { SptTag, SptVersion } from '../../../../shared/models/spt-core.model';
import { ElectronService } from './electron.service';
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
  private readonly httpClient = inject(HttpClient);
  private readonly forgeApiService = inject(ForgeApiService);

  private readonly config = signal<Configuration | null>(null);
  private readonly version = signal<SptVersion[]>([]);
  private readonly tags = signal<SptTag[] | null>([]);
  private readonly sptVersions = signal<SptVersion[]>([]);

  readonly configSignal = this.config.asReadonly();
  readonly versionSignal = this.version.asReadonly();
  readonly tagsSignal = this.tags.asReadonly();
  readonly sptVersionSignal = this.sptVersions.asReadonly();

  getCurrentConfiguration() {
    return this.httpClient
      .get<Configuration>(`${environment.githubConfigLink}/config.json?cacheBust=${Date.now()}`)
      .pipe(tap(config => this.config.set(config)));
  }

  getSptVersion() {
    return this.forgeApiService.getSptVersions().pipe(
      tap(sptVersions => {
        console.log(sptVersions.data);
        this.sptVersions.set(sptVersions.data);
      })
    );
  }

  getCurrentTags() {
    // TODOD Implement when TAGs api is available
    return of([]);
  }
}

import { inject, Injectable, signal } from '@angular/core';
import { InstallProgress, Mod } from '../models/mod';
import { firstValueFrom } from 'rxjs';
import { ElectronService } from './electron.service';
import { ForgeApiService, ForgeModVersion } from './forge-api.service';

@Injectable({
  providedIn: 'root',
})
export class ModListService {
  readonly electronService = inject(ElectronService);
  readonly forgeApiService = inject(ForgeApiService);

  private modList = signal<Mod[]>([]);
  private useIndexedMods = signal<boolean>(false);
  readonly modListSignal = this.modList.asReadonly();

  async addMod(modId: number) {
    if (this.modList().some(m => m.hub_id === modId || m.id === modId)) {
      return;
    }

    const modDetail = await firstValueFrom(this.forgeApiService.getModDetail(modId));
    this.modList.update(modItems => [...modItems, { ...(modDetail.data as unknown as Mod), installProgress: this.initialInstallProgress() }]);

    // const modDependenciesIds = this.getModDependenciesIds(mod);
    // if (modDependenciesIds.length > 0) {
    //   const signalMod = this.modList().find(m => m.name === mod.name);
    //   if (!signalMod) {
    //     return;
    //   }
    //
    //   signalMod.isDependenciesLoading = true;
    //   signalMod.dependencies = await firstValueFrom(this.fetchModDependencyData(FileHelper.extractHubIdFromUrl(mod.fileUrl), modDependenciesIds));
    //   signalMod.isDependenciesLoading = false;
    //   signalMod.installProgress = this.initialInstallProgress();
    //   this.updateMod();
    // }
    this.updateMod();
  }

  updateMod() {
    this.modList.update(state => [...state]);
  }

  removeMod(name: string) {
    this.modList.update(() => [...this.modList().filter(m => m.name !== name)]);
  }

  removeCompletedMods() {
    this.modList.update(() => [...this.modList().filter(m => !m.installProgress?.completed)]);
  }

  initialInstallProgress(): InstallProgress {
    return {
      completed: false,
      error: false,
      downloadStep: {
        start: false,
        error: false,
        percent: 0,
        totalBytes: '',
        transferredBytes: '',
      },
      unzipStep: {
        start: false,
        error: false,
        progress: 0,
      },
    };
  }

  clearFakeTutorialMods() {
    this.modList.set([]);
  }

  addFakeModForTutorial() {
    this.modList.set([
      {
        id: 0,
        hub_id: null,
        name: "Amands's Graphics",
        detail_url: null!,
        thumbnail: 'assets/images/813.png',
        teaser: 'Lighting and postprocessing overhaul',
        dependencies: [],
        isDependenciesLoading: false,
        notSupported: false,
        versions: [
          {
            spt_version_constraint: '4.0.13',
          },
        ] as unknown as ForgeModVersion[],
        installProgress: null!,
        isInvalid: false,
        slug: '',
        downloads: 0,
        source_code_links: [],
        featured: false,
        contains_ads: false,
        contains_ai_content: false,
        published_at: '',
        created_at: '',
        updated_at: '',
      },
      {
        id: 0,
        hub_id: null,
        name: "SAIN 2.0 - Solarint's AI Modifications - Full AI Combat System Replacement",
        detail_url: null!,
        thumbnail: 'assets/images/1062.jpg',
        teaser: "Bots that don't suck.",
        dependencies: [],
        isDependenciesLoading: false,
        notSupported: false,
        versions: [
          {
            spt_version_constraint: '4.0.13',
          },
        ] as unknown as ForgeModVersion[],
        installProgress: null!,
        isInvalid: false,
        slug: '',
        downloads: 0,
        source_code_links: [],
        featured: false,
        contains_ads: false,
        contains_ai_content: false,
        published_at: '',
        created_at: '',
        updated_at: '',
      },
      {
        id: 0,
        hub_id: null,
        name: 'SPT Realism Mod',
        detail_url: null!,
        thumbnail: 'assets/images/606.png',
        teaser: 'Realistic Overhaul of SPT designed around making the game experience as realistic and hardcore as possible. Highly configurable!',
        dependencies: [],
        isDependenciesLoading: false,
        notSupported: false,
        versions: [
          {
            spt_version_constraint: '4.0.13',
          },
        ] as unknown as ForgeModVersion[],
        installProgress: null!,
        isInvalid: false,
        slug: '',
        downloads: 0,
        source_code_links: [],
        featured: false,
        contains_ads: false,
        contains_ai_content: false,
        published_at: '',
        created_at: '',
        updated_at: '',
      },
    ]);
  }

  // private getModDependenciesIds(mod: Mod) {
  //   const config = this.#configurationService.configSignal();
  //   const hubId = mod.hubId ?? FileHelper.extractHubIdFromUrl(mod.fileUrl);
  //
  //   if (!hubId || !config) {
  //     return [];
  //   }
  //
  //   const modDependencySetting = config.modDependency.find(d => d.hubId === hubId);
  //   if (!modDependencySetting) {
  //     return [];
  //   }
  //
  //   return modDependencySetting.dependencies;
  // }

  // private fetchModDependencyData(modId: string | null, modDependencies: string[]) {
  //   return forkJoin(
  //     modDependencies.map((dep, i) =>
  //       this.#electronService.sendEvent<string, string>('get-mod-page', dep, `${modId}-${i}-${dep}`).pipe(
  //         switchMap(modPageLink => {
  //           const modUrl = environment.production ? modPageLink.args : modPageLink.args.replace('https://hub.sp-tarkov.com/', '');
  //           return this.#httpClient.get(modUrl, { responseType: 'text' }).pipe(
  //             map(modView => ({ hubId: dep, ...this.extractModInformation(modView, modPageLink.args) })),
  //             catchError(() => this.handleDependencyError())
  //           );
  //         }),
  //         map(e => e as Mod),
  //         catchError(() => this.handleDependencyError())
  //       )
  //     )
  //   );
  // }

  // private extractModInformation(htmlResult: string, modUrl: string): Mod | null {
  //   const modPageView = HtmlHelper.parseStringAsHtml(htmlResult);
  //
  //   if (!modPageView) {
  //     return null;
  //   }
  //
  //   return {
  //     name: modPageView.getElementsByClassName('contentTitle')?.[0]?.getElementsByTagName('span')[0].innerHTML,
  //     fileUrl: modUrl,
  //     modVersion: modPageView.getElementsByClassName('filebaseVersionNumber')[0].innerHTML ?? '',
  //     supportedSptVersion: modPageView.getElementsByClassName('labelList')[0]?.getElementsByClassName('badge label')[0]?.innerHTML ?? '',
  //     sptVersionColorCode: modPageView.getElementsByClassName('labelList')[0]?.getElementsByClassName('badge label')[0]?.className,
  //   } as Mod;
  // }

  // private handleDependencyError() {
  //   return of({
  //     name: 'Error while fetching dependency. Please check the hub page',
  //     supportedSptVersion: 'Error while fetching dependency version',
  //     sptVersionColorCode: 'badge label red',
  //     isInvalid: true,
  //   } as unknown as Mod);
  // }
}

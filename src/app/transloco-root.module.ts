import { HttpClient } from '@angular/common/http'
import {
  defaultProviders,
  Translation,
  TRANSLOCO_CONFIG,
  TRANSLOCO_LOADER,
  translocoConfig,
  TranslocoLoader,
} from '@ngneat/transloco'
import {
  EnvironmentProviders,
  Injectable,
  isDevMode,
  makeEnvironmentProviders,
} from '@angular/core'

@Injectable({ providedIn: 'root' })
export class TranslocoHttpLoader implements TranslocoLoader {
  constructor(private http: HttpClient) {}

  getTranslation(lang: string) {
    return this.http.get<Translation>(`/assets/i18n/${lang}.json`)
  }
}

export function provideTransloco(): EnvironmentProviders {
  return makeEnvironmentProviders([
    defaultProviders,
    {
      provide: TRANSLOCO_CONFIG,
      useValue: translocoConfig({
        availableLangs: ['en'],
        defaultLang: 'en',
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
      }),
    },
    { provide: TRANSLOCO_LOADER, useClass: TranslocoHttpLoader },
  ])
}

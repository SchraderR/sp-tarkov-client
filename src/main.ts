import { enableProdMode, importProvidersFrom, isDevMode, inject, provideAppInitializer, provideZoneChangeDetection } from '@angular/core';
import { environment } from './environments/environment';
import { AppComponent } from './app/app.component';
import { HttpHandlerFn, HttpRequest, provideHttpClient, withInterceptors, withInterceptorsFromDi } from '@angular/common/http';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { appRoutes } from './app/app.routing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { JoyrideModule } from 'ngx-joyride';
import { TranslocoHttpLoader } from './transloco-loader';
import { provideTransloco } from '@jsverse/transloco';
import { ConfigurationService } from './app/core/services/configuration.service';
import { forkJoin } from 'rxjs';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    provideZoneChangeDetection(),
    provideHttpClient(withInterceptorsFromDi()),
    provideRouter(appRoutes, withComponentInputBinding()),
    importProvidersFrom(JoyrideModule.forRoot()),
    provideAnimations(),
    provideTransloco({
      config: {
        availableLangs: ['en'],
        defaultLang: 'en',
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
      },
      loader: TranslocoHttpLoader,
    }),
    provideAppInitializer(() => {
      const configurationService = inject(ConfigurationService);
      return forkJoin([configurationService.getCurrentConfiguration(), configurationService.getSptVersion(), configurationService.getCurrentTags()]);
    }),
  ],
}).catch(err => console.error(err));

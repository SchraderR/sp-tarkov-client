import { enableProdMode, importProvidersFrom, isDevMode, inject, provideAppInitializer } from '@angular/core';
import { environment } from './environments/environment';
import { AppComponent } from './app/app.component';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { appRoutes } from './app/app.routing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { JoyrideModule } from 'ngx-joyride';
import { TranslocoHttpLoader } from './transloco-loader';
import { provideTransloco } from '@jsverse/transloco';
import { ConfigurationService } from './app/core/services/configuration.service';
import { firstValueFrom, forkJoin } from 'rxjs';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(withInterceptors([authInterceptor]), withInterceptorsFromDi()),
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

export function authInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn) {
  const authToken = environment.TEST_API_KEY_REMOVE_BEFORE_COMMIT;

  const newReq = req.clone({
    headers: req.headers.append('Authorization', `Bearer ${authToken}`),
  });
  return next(newReq);
}

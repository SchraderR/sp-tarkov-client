import { enableProdMode } from '@angular/core';
import { environment } from './environments/environment';
import { AppComponent } from './app/app.component';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideTransloco } from './app/transloco-root.module';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { appRoutes } from './app/app.routing';
import { provideAnimations } from '@angular/platform-browser/animations';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(withInterceptorsFromDi()),
    provideRouter(appRoutes, withComponentInputBinding()),
    provideAnimations(),
    provideTransloco(),
  ],
}).catch(err => console.error(err));

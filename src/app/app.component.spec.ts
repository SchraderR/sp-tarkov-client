import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { mockProvider } from '@ngneat/spectator';
import { ElectronService } from './core/services/electron.service';
import { TranslocoModule } from '@jsverse/transloco';
import { JoyrideModule } from 'ngx-joyride';
import { of } from 'rxjs';
import { provideRouter } from '@angular/router';

describe('AppComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, AppComponent, JoyrideModule.forRoot(), TranslocoModule, HttpClientTestingModule],
      providers: [
        provideRouter([]),
        mockProvider(ElectronService, {
          sendEvent: () => of(),
          getGithubRateLimitInformation: () => of(),
        }),
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  });
});

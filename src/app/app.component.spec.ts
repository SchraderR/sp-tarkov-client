import { TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from './app.component';
import { TranslocoModule } from '@ngneat/transloco';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { mockProvider } from '@ngneat/spectator';
import { JoyrideModule } from 'ngx-joyride';
import { ElectronService } from './core/services/electron.service';
import { EMPTY } from 'rxjs';

describe('AppComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, AppComponent, RouterTestingModule, TranslocoModule, HttpClientTestingModule, JoyrideModule.forRoot()],
      providers: [
        mockProvider(ElectronService, {
          sendEvent: () => EMPTY,
          getGithubRateLimitInformation: () => EMPTY,
        }),
      ],
    }).compileComponents();
  });

  it('should create the app', waitForAsync(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  }));
});

import { TestBed, waitForAsync } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { mockProvider } from '@ngneat/spectator';
import { ElectronService } from './core/services/electron.service';
import { TranslocoModule } from '@jsverse/transloco';
import { RouterTestingModule } from '@angular/router/testing';

xdescribe('AppComponent', () => {
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, AppComponent, RouterTestingModule, TranslocoModule, HttpClientTestingModule],
      providers: [mockProvider(ElectronService)],
    }).compileComponents();
  }));

  it('should create the app', waitForAsync(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  }));
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import ModListComponent from './mod-list.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { mockProvider } from '@ngneat/spectator';
import { ElectronService } from '../../core/services/electron.service';
import { of } from 'rxjs';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('ModListComponent', () => {
  let component: ModListComponent;
  let fixture: ComponentFixture<ModListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [NoopAnimationsModule, ModListComponent],
    providers: [mockProvider(ElectronService, { sendEvent: () => of() }), provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
}).compileComponents();

    fixture = TestBed.createComponent(ModListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

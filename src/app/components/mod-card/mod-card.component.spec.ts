import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModCardComponent } from './mod-card.component';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { ElectronService } from '../../core/services/electron.service';
import { DownloadService } from '../../core/services/download.service';
import { mockProvider } from '@ngneat/spectator';
import { Mod } from '../../core/models/mod';

describe('ModCardComponent', () => {
  let component: ModCardComponent;
  let fixture: ComponentFixture<ModCardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ModCardComponent],
      providers: [
        mockProvider(ElectronService),
        mockProvider(DownloadService),
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ModCardComponent);
    component = fixture.componentInstance;

    const mockMod: Mod = { thumbnail: 'bla' } as Mod;
    fixture.componentRef.setInput('mod', mockMod);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import ModUpdateOverviewComponent from './mod-update-overview.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { mockProvider } from '@ngneat/spectator';
import { ElectronService } from '../../core/services/electron.service';
import { of } from 'rxjs';

describe('ModUpdateOverviewComponent', () => {
  let component: ModUpdateOverviewComponent;
  let fixture: ComponentFixture<ModUpdateOverviewComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ModUpdateOverviewComponent, HttpClientTestingModule],
      providers: [mockProvider(ElectronService, { sendEvent: () => of() })],
    }).compileComponents();

    fixture = TestBed.createComponent(ModUpdateOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

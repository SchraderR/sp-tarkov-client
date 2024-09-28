import { ComponentFixture, TestBed } from '@angular/core/testing';
import InstanceOverviewComponent from './instance-overview.component';
import { mockProvider } from '@ngneat/spectator';
import { ElectronService } from '../../core/services/electron.service';
import { EMPTY } from 'rxjs';
import { ModListService } from '../../core/services/mod-list.service';
import { SptSearchService } from '../../core/services/spt-search.service';
import { provideRouter } from '@angular/router';

describe('InstanceOverviewComponent', () => {
  let component: InstanceOverviewComponent;
  let fixture: ComponentFixture<InstanceOverviewComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [InstanceOverviewComponent, provideRouter([])],
      providers: [
        mockProvider(ElectronService, {
          sendEvent: () => EMPTY,
        }),
        mockProvider(ModListService),
        mockProvider(SptSearchService),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InstanceOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import InstanceOverviewComponent from './instance-overview.component';
import { RouterTestingModule } from '@angular/router/testing';
import { mockProvider } from '@ngneat/spectator';
import { ElectronService } from '../../core/services/electron.service';
import { EMPTY } from 'rxjs';

describe('InstanceOverviewComponent', () => {
  let component: InstanceOverviewComponent;
  let fixture: ComponentFixture<InstanceOverviewComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [InstanceOverviewComponent, RouterTestingModule],
      providers: [
        mockProvider(ElectronService, {
          sendEvent: () => EMPTY,
        }),
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

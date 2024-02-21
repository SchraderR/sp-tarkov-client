import { ComponentFixture, TestBed } from '@angular/core/testing';
import InstanceOverviewComponent from './instance-overview.component';
import { RouterTestingModule } from '@angular/router/testing';

describe('InstanceOverviewComponent', () => {
  let component: InstanceOverviewComponent;
  let fixture: ComponentFixture<InstanceOverviewComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [InstanceOverviewComponent, RouterTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(InstanceOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

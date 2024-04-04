import { ComponentFixture, TestBed } from '@angular/core/testing';
import ModUpdateOverviewComponent from './mod-update-overview.component';

describe('ModUpdateOverviewComponent', () => {
  let component: ModUpdateOverviewComponent;
  let fixture: ComponentFixture<ModUpdateOverviewComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ModUpdateOverviewComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ModUpdateOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

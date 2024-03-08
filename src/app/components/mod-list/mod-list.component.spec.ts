import { ComponentFixture, TestBed } from '@angular/core/testing';
import ModListComponent from './mod-list.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('ModListComponent', () => {
  let component: ModListComponent;
  let fixture: ComponentFixture<ModListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, ModListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ModListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

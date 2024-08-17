import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModDependencyCardComponent } from './mod-dependency-card.component';

describe('ModDependencyCardComponent', () => {
  let component: ModDependencyCardComponent;
  let fixture: ComponentFixture<ModDependencyCardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ModDependencyCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ModDependencyCardComponent);
    component = fixture.componentInstance;
    component.mod = {
      fileUrl: '',
      isDependenciesLoading: false,
      isInvalid: false,
      dependencies: [],
      kind: 'client',
      supportedSptVersion: '',
      notSupported: false,
      name: '',
      image: '',
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

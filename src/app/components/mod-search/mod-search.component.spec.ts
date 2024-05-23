import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModSearchComponent } from './mod-search.component';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('ModSearchComponent', () => {
  let component: ModSearchComponent;
  let fixture: ComponentFixture<ModSearchComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [NoopAnimationsModule, ModSearchComponent],
    providers: [provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
}).compileComponents();

    fixture = TestBed.createComponent(ModSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

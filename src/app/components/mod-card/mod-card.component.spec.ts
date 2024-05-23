import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModCardComponent } from './mod-card.component';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('ModCardComponent', () => {
  let component: ModCardComponent;
  let fixture: ComponentFixture<ModCardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [ModCardComponent],
    providers: [provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
}).compileComponents();

    fixture = TestBed.createComponent(ModCardComponent);
    component = fixture.componentInstance;
    component.mod = { fileUrl: '', kind: undefined, supportedAkiVersion: '', notSupported: false, name: '', image: '' };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

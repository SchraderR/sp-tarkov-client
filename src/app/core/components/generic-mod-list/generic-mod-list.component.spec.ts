import { ComponentFixture, TestBed } from '@angular/core/testing';
import GenericModListComponent from './generic-mod-list.component';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('GenericModListComponent', () => {
  let component: GenericModListComponent;
  let fixture: ComponentFixture<GenericModListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [NoopAnimationsModule, GenericModListComponent],
    providers: [provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
}).compileComponents();

    fixture = TestBed.createComponent(GenericModListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

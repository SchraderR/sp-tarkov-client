import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModSearchComponent } from './mod-search.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('ModSearchComponent', () => {
  let component: ModSearchComponent;
  let fixture: ComponentFixture<ModSearchComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, ModSearchComponent, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(ModSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

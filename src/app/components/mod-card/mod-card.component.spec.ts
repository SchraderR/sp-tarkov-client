import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModCardComponent } from './mod-card.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('ModCardComponent', () => {
  let component: ModCardComponent;
  let fixture: ComponentFixture<ModCardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ModCardComponent, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(ModCardComponent);
    component = fixture.componentInstance;
    component.mod = { fileUrl: '', kind: undefined, name: '', image: '', extended: false };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

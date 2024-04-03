import { ComponentFixture, TestBed } from '@angular/core/testing';
import ModLoadOrderComponent from './mod-load-order.component';

describe('ModLoadOrderComponent', () => {
  let component: ModLoadOrderComponent;
  let fixture: ComponentFixture<ModLoadOrderComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ModLoadOrderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ModLoadOrderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

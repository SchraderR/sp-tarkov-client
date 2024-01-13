import { ComponentFixture, TestBed } from '@angular/core/testing';
import NewModsComponent from './new-mods.component';

describe('NewComponent', () => {
  let component: NewModsComponent;
  let fixture: ComponentFixture<NewModsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewModsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NewModsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

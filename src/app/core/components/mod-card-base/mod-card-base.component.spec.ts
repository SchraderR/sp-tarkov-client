import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModCardBaseComponent } from './mod-card-base.component';

describe('ModCardBaseComponent', () => {
  let component: ModCardBaseComponent;
  let fixture: ComponentFixture<ModCardBaseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModCardBaseComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ModCardBaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

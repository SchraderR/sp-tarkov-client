import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModDependencyCardComponent } from './mod-dependency-card.component';

describe('ModDependencyCardComponent', () => {
  let component: ModDependencyCardComponent;
  let fixture: ComponentFixture<ModDependencyCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModDependencyCardComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ModDependencyCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

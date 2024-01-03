import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModSearchComponent } from './mod-search.component';

describe('ModSearchComponent', () => {
  let component: ModSearchComponent;
  let fixture: ComponentFixture<ModSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModSearchComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ModSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

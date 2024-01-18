import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GenericModListComponent } from './generic-mod-list.component';

describe('GenericModListComponent', () => {
  let component: GenericModListComponent;
  let fixture: ComponentFixture<GenericModListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GenericModListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GenericModListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

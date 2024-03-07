import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TarkovStartComponent } from './tarkov-start.component';

describe('TarkovStartComponent', () => {
  let component: TarkovStartComponent;
  let fixture: ComponentFixture<TarkovStartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TarkovStartComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TarkovStartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

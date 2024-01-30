import { ComponentFixture, TestBed } from '@angular/core/testing';
import GenericModListComponent from './generic-mod-list.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('GenericModListComponent', () => {
  let component: GenericModListComponent;
  let fixture: ComponentFixture<GenericModListComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [GenericModListComponent, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(GenericModListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

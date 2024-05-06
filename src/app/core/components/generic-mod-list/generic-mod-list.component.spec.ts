import { ComponentFixture, TestBed } from '@angular/core/testing';
import GenericModListComponent from './generic-mod-list.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('GenericModListComponent', () => {
  let component: GenericModListComponent;
  let fixture: ComponentFixture<GenericModListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, GenericModListComponent, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(GenericModListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

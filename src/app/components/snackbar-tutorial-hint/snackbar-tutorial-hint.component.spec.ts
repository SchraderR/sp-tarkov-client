import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SnackbarTutorialHintComponent } from './snackbar-tutorial-hint.component';
import { MatSnackBarRef } from '@angular/material/snack-bar';

describe('SnackbarTutorialHintComponent', () => {
  let component: SnackbarTutorialHintComponent;
  let fixture: ComponentFixture<SnackbarTutorialHintComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SnackbarTutorialHintComponent],
      providers: [{ provide: MatSnackBarRef, useValue: {} }],
    }).compileComponents();

    fixture = TestBed.createComponent(SnackbarTutorialHintComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

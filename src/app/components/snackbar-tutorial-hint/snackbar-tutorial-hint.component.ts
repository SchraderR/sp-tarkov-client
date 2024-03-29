import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatSnackBarAction, MatSnackBarRef } from '@angular/material/snack-bar';

@Component({
  standalone: true,
  selector: 'app-snackbar-tutorial-hint',
  templateUrl: './snackbar-tutorial-hint.component.html',
  styleUrl: './snackbar-tutorial-hint.component.scss',
  imports: [CommonModule, MatButtonModule, MatSnackBarAction],
})
export class SnackbarTutorialHintComponent {
  snackBarRef = inject(MatSnackBarRef);
}

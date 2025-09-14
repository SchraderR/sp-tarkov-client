import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarAction, MatSnackBarRef } from '@angular/material/snack-bar';

@Component({
    selector: 'app-snackbar-tutorial-hint',
    templateUrl: './snackbar-tutorial-hint.component.html',
    styleUrl: './snackbar-tutorial-hint.component.scss',
    imports: [MatButtonModule, MatSnackBarAction]
})
export class SnackbarTutorialHintComponent {
  snackBarRef = inject(MatSnackBarRef);
}

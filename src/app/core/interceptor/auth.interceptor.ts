import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, switchMap, throwError } from 'rxjs';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { environment } from '../../../../app/environment';
import { ElectronService } from '../services/electron.service';

const WATCHED_URL = environment.forgeBasePath;
const SNACKBAR_CONFIG: MatSnackBarConfig = {
  duration: 1000000,
  horizontalPosition: 'center',
  verticalPosition: 'top',
  panelClass: ['auth-snackbar'],
};

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const snackBar = inject(MatSnackBar);
  const electronService = inject(ElectronService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && req.url.includes(WATCHED_URL)) {
        snackBar
          .open('Authkey expired or unauthorized. Please log in again.', 'Purge Authkey and restart', SNACKBAR_CONFIG)
          .onAction()
          .pipe(
            switchMap(action => {
              console.log('action: ', action);
              return electronService.sendEvent('remove-auth-key', true);
            })
          )
          .subscribe();
      }

      return throwError(() => error);
    })
  );
};

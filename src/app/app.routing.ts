import { Routes } from '@angular/router';

export const appRoutes: Routes = [
  {
    path: '',
    redirectTo: 'setting',
    pathMatch: 'full',
  },
  {
    path: 'setting',
    loadComponent: () => import('./components/personal-setting/personal-setting.component'),
  },
  {
    path: 'top-rated',
    loadComponent: () => import('./components/top-rated/top-rated.component'),
  },
  {
    path: 'mod-list',
    loadComponent: () => import('./components/mod-list/mod-list.component'),
  },
];

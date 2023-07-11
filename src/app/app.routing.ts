import { Routes } from '@angular/router';

export const appRoutes: Routes = [
  {
    path: '',
    redirectTo: 'setting',
    pathMatch: 'full',
  },
  {
    path: 'github-release',
    loadComponent: () => import('./components/github-release-list/github-release-list.component'),
  },
  {
    path: 'setting',
    loadComponent: () => import('./components/personal-setting/personal-setting.component'),
  },
];

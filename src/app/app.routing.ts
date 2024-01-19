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
    loadComponent: () => import('./core/components/generic-mod-list/generic-mod-list.component'),
    data: {
      sortField: 'cumulativeLikes',
      sortOrder: 'DESC',
    },
  },
  {
    path: 'new',
    loadComponent: () => import('./core/components/generic-mod-list/generic-mod-list.component'),
    data: {
      sortField: 'time',
      sortOrder: 'DESC',
    },
  },
  {
    path: 'updated',
    loadComponent: () => import('./core/components/generic-mod-list/generic-mod-list.component'),
    data: {
      sortField: 'lastChangeTime',
      sortOrder: 'DESC',
    },
  },
  {
    path: 'most-loaded',
    loadComponent: () => import('./core/components/generic-mod-list/generic-mod-list.component'),
    data: {
      sortField: 'downloads',
      sortOrder: 'DESC',
    },
  },
  {
    path: 'mod-list',
    loadComponent: () => import('./components/mod-list/mod-list.component'),
  },
];

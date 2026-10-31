import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/demos-hub/demos-hub.component').then(
        (component) => component.DemosHubComponent,
      ),
  },
  {
    path: 'mvp/personal',
    loadComponent: () =>
      import('./features/personal-mvp/personal-mvp.component').then(
        (component) => component.PersonalMvpComponent,
      ),
  },
  {
    path: 'mvp/auditoria',
    loadComponent: () =>
      import('./features/auditoria-mvp/auditoria-mvp.component').then(
        (component) => component.AuditoriaMvpComponent,
      ),
  },
  { path: '**', redirectTo: '' },
];

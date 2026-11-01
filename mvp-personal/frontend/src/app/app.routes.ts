import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard',
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/personal-dashboard.component').then(
        (component) => component.PersonalDashboardComponent,
      ),
  },
  {
    path: 'fichajes',
    loadComponent: () =>
      import('./features/biometric-sim/biometric-sim.component').then(
        (component) => component.BiometricSimComponent,
      ),
  },
  {
    path: 'personal',
    loadComponent: () =>
      import('./features/personal-mgmt/personal-mgmt.component').then(
        (component) => component.PersonalMgmtComponent,
      ),
  },
  {
    path: 'asistencia',
    loadComponent: () =>
      import('./features/asistencia/asistencia.component').then(
        (component) => component.AsistenciaComponent,
      ),
  },
  {
    path: 'licencias',
    loadComponent: () =>
      import('./features/licencias/licencias.component').then(
        (component) => component.LicenciasComponent,
      ),
  },
  {
    path: 'reportes',
    loadComponent: () =>
      import('./features/reportes/reportes.component').then(
        (component) => component.ReportesComponent,
      ),
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];

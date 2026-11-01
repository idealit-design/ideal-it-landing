import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: 'home', pathMatch: 'full', redirectTo: '' },
  {
    path: '',
    loadComponent: () =>
      import('./features/demos-hub/demos-hub.component').then(
        (component) => component.DemosHubComponent,
      ),
  },
  {
    path: 'categorias/desarrollos',
    data: { categoryId: 'desarrollos' },
    loadComponent: () =>
      import('./features/category-landing/category-landing.component').then(
        (component) => component.CategoryLandingComponent,
      ),
  },
  {
    path: 'categorias/aplicaciones',
    data: { categoryId: 'aplicaciones' },
    loadComponent: () =>
      import('./features/category-landing/category-landing.component').then(
        (component) => component.CategoryLandingComponent,
      ),
  },
  {
    path: 'categorias/paginas-comerciales',
    data: { categoryId: 'paginas-comerciales' },
    loadComponent: () =>
      import('./features/category-landing/category-landing.component').then(
        (component) => component.CategoryLandingComponent,
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
  {
    path: 'mvp/formularios',
    loadComponent: () =>
      import('./features/formularios-preview/formularios-preview.component').then(
        (component) => component.FormulariosPreviewComponent,
      ),
  },
  { path: '**', redirectTo: '', pathMatch: 'full' },
];

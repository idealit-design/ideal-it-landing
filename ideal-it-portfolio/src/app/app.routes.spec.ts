import { routes } from './app.routes';

describe('application routes', () => {
  it('routes both the root and home alias to the demos hub', () => {
    expect(routes.find((route) => route.path === '')?.loadComponent).toBeDefined();
    expect(routes.find((route) => route.path === 'home')).toEqual(
      jasmine.objectContaining({ redirectTo: '', pathMatch: 'full' }),
    );
  });

  it('preserves the independent MVP routes and redirects unknown paths to home', () => {
    expect(routes.map((route) => route.path)).toContain('mvp/personal');
    expect(routes.map((route) => route.path)).toContain('mvp/auditoria');
    expect(routes.map((route) => route.path)).toContain('mvp/formularios');
    expect(routes.find((route) => route.path === '**')).toEqual(
      jasmine.objectContaining({ redirectTo: '', pathMatch: 'full' }),
    );
  });

  it('exposes a dedicated category landing for each portfolio grouping', () => {
    expect(routes.find((route) => route.path === 'categorias/desarrollos')?.data).toEqual({
      categoryId: 'desarrollos',
    });
    expect(routes.find((route) => route.path === 'categorias/aplicaciones')?.data).toEqual({
      categoryId: 'aplicaciones',
    });
    expect(routes.find((route) => route.path === 'categorias/paginas-comerciales')?.data).toEqual({
      categoryId: 'paginas-comerciales',
    });
  });
});

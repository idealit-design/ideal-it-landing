import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'mvp-root',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="min-h-screen">
      <header class="border-b border-slate-800 bg-slate-950/95">
        <div class="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <a class="min-w-0" routerLink="/dashboard">
            <p class="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">Ideal-IT · Local Standalone</p>
            <h1 class="mt-1 text-2xl font-black tracking-tight sm:text-3xl">Control de personal</h1>
          </a>
          <span class="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-200">MVP 0.2.0 · SQLite aislada</span>
        </div>
      </header>

      <div class="mx-auto grid max-w-[1600px] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:px-8">
        <nav class="flex gap-2 overflow-x-auto lg:sticky lg:top-6 lg:h-fit lg:flex-col" aria-label="Secciones de personal">
          <a routerLink="/dashboard" routerLinkActive="!border-cyan-400 !bg-cyan-400/10 !text-cyan-100" [routerLinkActiveOptions]="{ exact: true }" ariaCurrentWhenActive="page" class="whitespace-nowrap rounded-lg border border-slate-800 px-3 py-2.5 text-sm text-slate-300 transition hover:border-slate-600 hover:text-white">Resumen operativo</a>
          <a routerLink="/fichajes" routerLinkActive="!border-cyan-400 !bg-cyan-400/10 !text-cyan-100" ariaCurrentWhenActive="page" class="whitespace-nowrap rounded-lg border border-slate-800 px-3 py-2.5 text-sm text-slate-300 transition hover:border-slate-600 hover:text-white">Fichajes biométricos</a>
          <a routerLink="/personal" routerLinkActive="!border-cyan-400 !bg-cyan-400/10 !text-cyan-100" ariaCurrentWhenActive="page" class="whitespace-nowrap rounded-lg border border-slate-800 px-3 py-2.5 text-sm text-slate-300 transition hover:border-slate-600 hover:text-white">Personal y áreas</a>
          <a routerLink="/asistencia" routerLinkActive="!border-cyan-400 !bg-cyan-400/10 !text-cyan-100" ariaCurrentWhenActive="page" class="whitespace-nowrap rounded-lg border border-slate-800 px-3 py-2.5 text-sm text-slate-300 transition hover:border-slate-600 hover:text-white">Historial de asistencia</a>
          <a routerLink="/licencias" routerLinkActive="!border-cyan-400 !bg-cyan-400/10 !text-cyan-100" ariaCurrentWhenActive="page" class="whitespace-nowrap rounded-lg border border-slate-800 px-3 py-2.5 text-sm text-slate-300 transition hover:border-slate-600 hover:text-white">Licencias y vacaciones</a>
          <a routerLink="/reportes" routerLinkActive="!border-cyan-400 !bg-cyan-400/10 !text-cyan-100" ariaCurrentWhenActive="page" class="whitespace-nowrap rounded-lg border border-slate-800 px-3 py-2.5 text-sm text-slate-300 transition hover:border-slate-600 hover:text-white">Reportes</a>
        </nav>

        <main class="min-w-0">
          <router-outlet />
          <footer class="mt-8 border-t border-slate-800 pt-4 text-xs text-slate-500">Las marcas son sintéticas y no se realizan conexiones a relojes ni a redes de dispositivos.</footer>
        </main>
      </div>
    </div>
  `,
})
export class AppComponent {}

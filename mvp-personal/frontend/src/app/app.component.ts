import { Component } from '@angular/core';
import { AsistenciaComponent } from './features/asistencia/asistencia.component';
import { BiometricSimComponent } from './features/biometric-sim/biometric-sim.component';
import { PersonalMgmtComponent } from './features/personal-mgmt/personal-mgmt.component';
import { ReportesComponent } from './features/reportes/reportes.component';
import { LicenciasComponent } from './features/licencias/licencias.component';

@Component({
  selector: 'mvp-root',
  standalone: true,
  imports: [AsistenciaComponent, BiometricSimComponent, PersonalMgmtComponent, ReportesComponent, LicenciasComponent],
  template: `
    <main class="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header class="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">Ideal-IT · Local Standalone</p>
          <h1 class="mt-2 text-4xl font-black tracking-tight">MVP Personal <span class="text-cyan-300">0.1.1</span></h1>
          <p class="mt-2 max-w-2xl text-slate-400">Asistencia biométrica simulada, gestión de personal, licencias y reportes hábiles.</p>
        </div>
        <span class="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200">SQLite aislada</span>
      </header>
      <div class="grid gap-5 lg:grid-cols-2">
        <mvp-biometric-sim />
        <mvp-reportes />
        <mvp-personal-mgmt />
        <mvp-asistencia />
        <mvp-licencias />
      </div>
      <footer class="mt-8 border-t border-slate-800 pt-4 text-xs text-slate-500">Las marcas son sintéticas y no se realizan conexiones a relojes ni a redes de dispositivos.</footer>
    </main>
  `,
})
export class AppComponent {}

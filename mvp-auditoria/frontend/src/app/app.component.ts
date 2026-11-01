import { Component } from '@angular/core';
import { AuditoriaDashboardComponent } from './features/auditoria-dashboard/auditoria-dashboard.component';
import { BovedaVisualComponent } from './features/boveda-visual/boveda-visual.component';
import { NomencladorVinculacionComponent } from './features/nomenclador-vinculacion/nomenclador-vinculacion.component';
import { ValidadorIdentidadComponent } from './features/validador-identidad/validador-identidad.component';

@Component({
  selector: 'audit-root',
  standalone: true,
  imports: [
    AuditoriaDashboardComponent,
    BovedaVisualComponent,
    ValidadorIdentidadComponent,
    NomencladorVinculacionComponent,
  ],
  template: `
    <main>
      <header class="row" style="margin-bottom: 24px">
        <div><p class="muted">Ideal-IT · Local Standalone</p><h1>MVP Auditoría <span style="color:#67e8f9">0.1.2</span></h1><p class="muted">Auditoría de prestadores, documentos y prácticas en entorno local.</p></div>
        <strong>SQLite aislada · Puerto API 8002</strong>
      </header>
      <div class="grid">
        <audit-dashboard />
        <audit-validador-identidad />
        <audit-boveda-visual />
        <audit-nomenclador-vinculacion />
      </div>
      <footer class="muted" style="margin-top:20px">Validaciones simuladas. Los datos y documentos permanecen en este equipo.</footer>
    </main>
  `,
})
export class AppComponent {}

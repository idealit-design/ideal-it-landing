<script setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useAgrotechStore } from '../stores/agrotech'
import LotMap from '../components/LotMap.vue'
import MoistureChart from '../components/MoistureChart.vue'

const store = useAgrotechStore()
const showForm = ref(false)
const submitting = ref(false)
const formError = ref('')
const form = reactive({ codigo_lote: '', cultivo: '', hectareas: '' })
let refreshTimer

const averageMoisture = computed(() => {
  const values = store.lotes
    .map((lot) => lot.humedad_actual)
    .filter((value) => value != null)
    .map(Number)
  return values.length ? `${(values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1)}%` : '—'
})

const updatedLabel = computed(() => store.ultimaActualizacion
  ? store.ultimaActualizacion.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  : '—')

async function submitLote() {
  submitting.value = true
  formError.value = ''
  try {
    await store.createLote({
      codigo_lote: form.codigo_lote.trim(),
      cultivo: form.cultivo.trim(),
      hectareas: Number(form.hectareas),
    })
    Object.assign(form, { codigo_lote: '', cultivo: '', hectareas: '' })
    showForm.value = false
  } catch (error) {
    formError.value = error.message
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  store.refresh()
  refreshTimer = window.setInterval(store.refresh, 30000)
})
onUnmounted(() => window.clearInterval(refreshTimer))
</script>

<template>
  <main class="min-h-screen">
    <header class="topbar">
      <a class="brand" href="#" aria-label="AgroTech inicio">
        <span class="brand-mark">A</span>
        <span><strong>AGROTECH</strong><small>SMART CROP SYSTEM</small></span>
      </a>
      <div class="topbar-right">
        <span class="live-status"><i></i> TELEMETRÍA ACTIVA</span>
        <span class="version-tag">MVP · 0.1.1</span>
      </div>
    </header>

    <section class="page-shell">
      <div class="page-heading">
        <div>
          <div class="eyebrow">CENTRO DE OPERACIONES <span>/</span> CAMPO</div>
          <h1>Monitoreo inteligente <em>del cultivo.</em></h1>
          <p>Estado de lotes, sensores de humedad y reconocimiento aéreo en un solo lugar.</p>
        </div>
        <div class="heading-actions">
          <span class="updated-label">ACTUALIZADO {{ updatedLabel }}</span>
          <button class="button button-quiet" :disabled="store.loading" @click="store.refresh">
            <span :class="{ 'spin': store.loading }">↻</span> Actualizar
          </button>
          <button class="button button-primary" @click="showForm = !showForm">＋ Nuevo lote</button>
        </div>
      </div>

      <div v-if="store.error" class="alert-error" role="alert">
        <span>{{ store.error }}</span>
        <button @click="store.refresh">Reintentar</button>
      </div>

      <form v-if="showForm" class="new-lot-form panel" @submit.prevent="submitLote">
        <div class="form-title"><strong>Agregar parcela</strong><button type="button" class="close-button" @click="showForm = false">×</button></div>
        <div class="form-grid">
          <label>Código del lote<input v-model="form.codigo_lote" required maxlength="80" placeholder="NORTE-01" /></label>
          <label>Cultivo<input v-model="form.cultivo" required maxlength="120" placeholder="Trigo" /></label>
          <label>Superficie (ha)<input v-model="form.hectareas" required min="0.01" step="0.01" type="number" placeholder="24.5" /></label>
          <button class="button button-primary form-submit" :disabled="submitting">{{ submitting ? 'Guardando…' : 'Guardar lote' }}</button>
        </div>
        <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>
      </form>

      <div class="metrics-grid">
        <article class="metric-card">
          <div class="metric-label">LOTES MONITOREADOS <span class="metric-icon">▦</span></div>
          <div class="metric-value">{{ store.resumen.total_lotes }}<small> parcelas</small></div>
          <div class="metric-caption">Unidades productivas registradas</div>
        </article>
        <article class="metric-card metric-alert">
          <div class="metric-label">ALERTAS HÍDRICAS <span class="metric-icon">⌁</span></div>
          <div class="metric-value">{{ store.resumen.lotes_con_alerta }}<small> lotes</small></div>
          <div class="metric-caption">{{ store.resumen.lotes_con_alerta ? 'Requieren atención en campo' : 'Todos los lotes están óptimos' }}</div>
        </article>
        <article class="metric-card">
          <div class="metric-label">HUMEDAD PROMEDIO <span class="metric-icon">◉</span></div>
          <div class="metric-value">{{ averageMoisture }}</div>
          <div class="metric-caption">Última lectura de cada parcela</div>
        </article>
        <article class="metric-card">
          <div class="metric-label">SUPERFICIE TOTAL <span class="metric-icon">⌖</span></div>
          <div class="metric-value">{{ Number(store.resumen.hectareas_totales).toLocaleString('es-AR') }}<small> ha</small></div>
          <div class="metric-caption">Área agrícola monitoreada</div>
        </article>
      </div>

      <div class="content-grid">
        <section class="panel map-panel">
          <div class="panel-heading">
            <div><div class="eyebrow">VISTA OPERATIVA</div><h2>Mapa de parcelas</h2></div>
            <div class="legend"><span><i class="legend-optimal"></i>Óptimo</span><span><i class="legend-warning"></i>Alerta</span><span><i class="legend-critical"></i>Crítico</span></div>
          </div>
          <LotMap :lots="store.lotes" />
          <div class="map-foot"><span>VISTA ESQUEMÁTICA · NO GEOREFERENCIADA</span><span>{{ store.lotes.length }} parcelas</span></div>
        </section>

        <section class="panel chart-panel">
          <div class="panel-heading">
            <div><div class="eyebrow">SENSORES IoT</div><h2>Humedad del suelo</h2></div>
            <span class="unit-pill">% VOLUMÉTRICO</span>
          </div>
          <MoistureChart :readings="store.telemetry" />
          <div class="chart-summary">
            <div><span class="summary-dot"></span><strong>{{ store.telemetry.filter((item) => item.tipo_sensor === 'HUMEDAD_SUELO').length }}</strong><small> lecturas recientes</small></div>
            <span>Actualización cada 30 s</span>
          </div>
        </section>
      </div>

      <section class="panel lots-panel">
        <div class="panel-heading">
          <div><div class="eyebrow">ESTADO DE CULTIVOS</div><h2>Detalle por lote</h2></div>
          <span class="table-note">Umbrales: crítico ≤20% · alerta ≤35%</span>
        </div>
        <div class="table-scroll">
          <table>
            <thead><tr><th>LOTE</th><th>CULTIVO</th><th>SUPERFICIE</th><th>HUMEDAD</th><th>VUELOS</th><th>ESTADO</th></tr></thead>
            <tbody>
              <tr v-for="lot in store.lotes" :key="lot.id">
                <td class="lot-code">{{ lot.codigo_lote }}</td><td>{{ lot.cultivo }}</td>
                <td>{{ Number(lot.hectareas).toLocaleString('es-AR') }} ha</td>
                <td><span v-if="lot.humedad_actual != null" class="humidity-value">{{ Number(lot.humedad_actual).toFixed(1) }}%</span><span v-else class="muted">Sin lectura</span></td>
                <td>{{ lot.vuelos_registrados }}</td>
                <td><span class="health-badge" :class="`health-${lot.estado_salud.toLowerCase()}`"><i></i>{{ lot.estado_salud.replace('_', ' ') }}</span></td>
              </tr>
              <tr v-if="!store.lotes.length"><td colspan="6" class="empty-table">No hay lotes. Agregue uno para comenzar el monitoreo.</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <footer class="dashboard-footer">
        <span>AGROTECH SMART CROP & DRONE TELEMETRY <b>·</b> VERSIÓN 0.1.1</span>
        <div><a :href="store.reportUrl('csv')">Descargar CSV ↗</a><a :href="store.reportUrl('pdf')">Reporte PDF ↗</a></div>
      </footer>
    </section>
  </main>
</template>

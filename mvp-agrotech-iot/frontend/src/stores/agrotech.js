import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/$/, '')

async function request(path, options = {}) {
  let response
  try {
    response = await fetch(`${apiBase}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    })
  } catch {
    throw new Error('No se pudo conectar con la API. Compruebe que Go y PostgreSQL estén activos.')
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error || `La API respondió ${response.status}`)
  }
  return response
}

export const useAgrotechStore = defineStore('agrotech', () => {
  const lotes = ref([])
  const resumen = ref({ total_lotes: 0, lotes_con_alerta: 0, hectareas_totales: 0 })
  const telemetry = ref([])
  const loading = ref(false)
  const error = ref('')
  const ultimaActualizacion = ref(null)
  const lotesEnAlerta = computed(() => lotes.value.filter((lote) => lote.estado_salud !== 'OPTIMO'))

  async function refresh() {
    loading.value = true
    error.value = ''
    try {
      const [dashboardResponse, telemetryResponse] = await Promise.all([
        request('/api/dashboard'),
        request('/api/telemetry?limit=80'),
      ])
      const dashboard = await dashboardResponse.json()
      lotes.value = dashboard.lotes
      resumen.value = dashboard.resumen
      telemetry.value = await telemetryResponse.json()
      ultimaActualizacion.value = new Date()
    } catch (reason) {
      error.value = reason.message
    } finally {
      loading.value = false
    }
  }

  async function createLote(payload) {
    const response = await request('/api/lotes', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    await response.json()
    await refresh()
  }

  function reportUrl(format) {
    return `${apiBase}/api/reports/export?format=${encodeURIComponent(format)}`
  }

  return { lotes, resumen, telemetry, loading, error, ultimaActualizacion, lotesEnAlerta, refresh, createLote, reportUrl }
})

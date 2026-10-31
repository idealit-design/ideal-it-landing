<script setup>
import { computed } from 'vue'

const props = defineProps({
  readings: { type: Array, default: () => [] },
})

const points = computed(() => {
  const values = props.readings
    .filter((reading) => reading.tipo_sensor === 'HUMEDAD_SUELO')
    .slice(0, 24)
    .reverse()
  if (!values.length) return []
  return values.map((reading, index) => ({
    x: values.length === 1 ? 50 : 8 + (index / (values.length - 1)) * 84,
    y: 88 - Math.max(0, Math.min(100, reading.valor_lectura)) * 0.72,
    value: reading.valor_lectura,
  }))
})

const line = computed(() => points.value.map((point) => `${point.x},${point.y}`).join(' '))
</script>

<template>
  <div class="chart-wrap">
    <div v-if="points.length" class="chart">
      <div class="chart-guides">
        <span>100%</span><span>50%</span><span>0%</span>
      </div>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Historial de humedad del suelo">
        <line x1="7" y1="16" x2="95" y2="16" class="guide-line" />
        <line x1="7" y1="52" x2="95" y2="52" class="guide-line" />
        <line x1="7" y1="88" x2="95" y2="88" class="guide-line" />
        <polyline :points="line" class="moisture-line" />
        <circle v-for="(point, index) in points" :key="index" :cx="point.x" :cy="point.y" r="1.5" class="moisture-point">
          <title>{{ point.value.toFixed(1) }}%</title>
        </circle>
      </svg>
    </div>
    <div v-else class="empty-chart">Aún no hay lecturas de humedad registradas.</div>
    <div class="chart-foot"><span>Registros recientes</span><span>Humedad de suelo</span></div>
  </div>
</template>

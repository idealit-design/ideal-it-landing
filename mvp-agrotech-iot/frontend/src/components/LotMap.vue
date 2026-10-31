<script setup>
defineProps({
  lots: { type: Array, default: () => [] },
})

function healthClass(status) {
  if (status === 'CRITICO') return 'parcel parcel-critical'
  if (status === 'ALERTA_HIDRICA') return 'parcel parcel-warning'
  return 'parcel parcel-optimal'
}
</script>

<template>
  <div v-if="lots.length" class="field-map">
    <article v-for="(lot, index) in lots" :key="lot.id" :class="healthClass(lot.estado_salud)">
      <div class="parcel-index">PARCELA {{ String(index + 1).padStart(2, '0') }}</div>
      <strong>{{ lot.codigo_lote }}</strong>
      <span>{{ lot.cultivo }} · {{ lot.hectareas }} ha</span>
      <div class="parcel-bottom">
        <span>{{ lot.humedad_actual == null ? 'Sin humedad' : `${Number(lot.humedad_actual).toFixed(1)}% humedad` }}</span>
        <span class="parcel-dot" :aria-label="lot.estado_salud"></span>
      </div>
    </article>
  </div>
  <div v-else class="empty-map">Cree un lote o registre telemetría para visualizar el campo.</div>
</template>

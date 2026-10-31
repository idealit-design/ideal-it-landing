const QUEUE_KEY = "osma-inspecciones-pendientes-v1";
const AFFILIATE_CACHE_KEY = "osma-afiliados-cache-v1";
const INSPECTOR_CACHE_KEY = "osma-inspectores-cache-v1";

export function readPendingInspections() {
  const raw = localStorage.getItem(QUEUE_KEY);
  if (!raw) return [];
  const records = JSON.parse(raw);
  if (!Array.isArray(records)) {
    throw new Error("La cola local de inspecciones tiene un formato inválido.");
  }
  return records;
}

export function enqueueInspection(inspection) {
  const records = readPendingInspections();
  records.push(inspection);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(records));
  return records;
}

export function removeSyncedInspections(clientIds) {
  const syncedIds = new Set(clientIds);
  const remaining = readPendingInspections().filter((record) => !syncedIds.has(record.client_id));
  localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
  return remaining;
}

export function readCachedAffiliates() {
  const raw = localStorage.getItem(AFFILIATE_CACHE_KEY);
  if (!raw) return [];
  const affiliates = JSON.parse(raw);
  if (!Array.isArray(affiliates)) {
    throw new Error("La caché local de afiliados tiene un formato inválido.");
  }
  return affiliates;
}

export function cacheAffiliates(affiliates) {
  localStorage.setItem(AFFILIATE_CACHE_KEY, JSON.stringify(affiliates));
}

export function readCachedInspectors() {
  const raw = localStorage.getItem(INSPECTOR_CACHE_KEY);
  if (!raw) return [];
  const inspectors = JSON.parse(raw);
  if (!Array.isArray(inspectors)) {
    throw new Error("La caché local de inspectores tiene un formato inválido.");
  }
  return inspectors;
}

export function cacheInspectors(inspectors) {
  localStorage.setItem(INSPECTOR_CACHE_KEY, JSON.stringify(inspectors));
}

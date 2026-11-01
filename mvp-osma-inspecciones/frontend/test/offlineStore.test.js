import assert from "node:assert/strict";
import { before, test } from "node:test";
import { indexedDB } from "fake-indexeddb";

const legacyInspection = {
  client_id: "legacy-client-001",
  inspector_id: 1,
  afiliado_dni: "30000001",
  fecha_inspeccion: "2026-10-31T12:00:00.000Z",
  observaciones: "Información confidencial migrada",
  datos_json: { direccion: "Calle privada 123", cuit: "20-12345678-9" },
};

const localValues = new Map([
  ["osma-inspecciones-pendientes-v1", JSON.stringify([legacyInspection])],
  ["osma-afiliados-cache-v1", JSON.stringify([{ dni: "30000001", nombre_apellido: "Afiliado Demo" }])],
  ["osma-inspectores-cache-v1", JSON.stringify([{ id: 1, nombre: "Inspector Demo" }])],
]);
globalThis.indexedDB = indexedDB;
globalThis.localStorage = {
  getItem: (key) => localValues.get(key) ?? null,
  removeItem: (key) => localValues.delete(key),
};

let store;
before(async () => {
  store = await import("../src/offlineStore.js");
});

test("migrates legacy forms and private caches into encrypted storage", async () => {
  const migrated = await store.listOfflineInspections();
  assert.equal(migrated.length, 1);
  assert.equal(migrated[0].client_id, legacyInspection.client_id);
  assert.equal(migrated[0].sync_status, "pending");
  assert.deepEqual(await store.readCachedAffiliates(), [
    { dni: "30000001", nombre_apellido: "Afiliado Demo" },
  ]);
  assert.deepEqual(await store.readCachedInspectors(), [{ id: 1, nombre: "Inspector Demo" }]);
  assert.equal(localValues.size, 0, "legacy plaintext is deleted only after migration");

  const database = await new Promise((resolve, reject) => {
    const request = indexedDB.open("osma-inspecciones-offline", 1);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  const storedInspection = await new Promise((resolve, reject) => {
    const request = database.transaction("inspections").objectStore("inspections")
      .get(legacyInspection.client_id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  const storedAffiliates = await new Promise((resolve, reject) => {
    const request = database.transaction("privateCache").objectStore("privateCache").get("affiliates");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  database.close();
  assert.equal(JSON.stringify(storedInspection).includes("Calle privada 123"), false);
  assert.equal(JSON.stringify(storedInspection).includes("20-12345678-9"), false);
  assert.equal(JSON.stringify(storedAffiliates).includes("Afiliado Demo"), false);
});

test("enqueue is idempotent for a client_id and rejects conflicting payloads", async () => {
  const unchanged = await store.enqueueInspection(legacyInspection);
  assert.equal(unchanged.length, 1);
  await assert.rejects(
    store.enqueueInspection({ ...legacyInspection, datos_json: { direccion: "Otra calle" } }),
    /client_id ya está asociado/,
  );
  const newInspection = {
    ...legacyInspection,
    client_id: "new-client-002",
    datos_json: { direccion: "Dirección confidencial 456" },
  };
  const queued = await store.enqueueInspection(newInspection);
  assert.equal(queued.find((record) => record.client_id === newInspection.client_id).sync_status, "pending");
  assert.equal(
    (await store.readPendingInspections()).some((record) => record.client_id === newInspection.client_id),
    true,
  );
});

test("records retryable errors and retains acknowledged records as sent", async () => {
  await store.markInspectionsFailed([legacyInspection.client_id], "Error de prueba");
  const failed = (await store.listOfflineInspections())
    .find((record) => record.client_id === legacyInspection.client_id);
  assert.equal(failed.sync_status, "error");
  assert.equal(failed.attempts, 1);
  assert.equal(failed.last_error, "Error de prueba");
  assert.equal(
    (await store.readPendingInspections()).some((record) => record.client_id === legacyInspection.client_id),
    false,
  );
  assert.equal(
    (await store.readPendingInspections({ force: true }))
      .some((record) => record.client_id === legacyInspection.client_id),
    true,
  );

  await store.markInspectionsSent([legacyInspection.client_id]);
  const sent = (await store.listOfflineInspections())
    .find((record) => record.client_id === legacyInspection.client_id);
  assert.equal(sent.sync_status, "sent");
  assert.equal(sent.last_error, null);
  await store.markInspectionsSent(["new-client-002"]);
  assert.equal(
    (await store.readPendingInspections({ force: true }))
      .some((record) => record.client_id === legacyInspection.client_id),
    false,
  );
});

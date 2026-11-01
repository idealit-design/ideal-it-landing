const DATABASE_NAME = "osma-inspecciones-offline";
const DATABASE_VERSION = 1;
const INSPECTIONS_STORE = "inspections";
const PRIVATE_CACHE_STORE = "privateCache";
const META_STORE = "meta";
const LEGACY_KEYS = {
  inspections: "osma-inspecciones-pendientes-v1",
  affiliates: "osma-afiliados-cache-v1",
  inspectors: "osma-inspectores-cache-v1",
};

let databasePromise;
let cryptoKeyPromise;
let migrationPromise;

function openDatabase() {
  if (!globalThis.indexedDB) {
    return Promise.reject(new Error("IndexedDB no está disponible en este navegador."));
  }
  if (!databasePromise) {
    databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(INSPECTIONS_STORE)) {
          database.createObjectStore(INSPECTIONS_STORE, { keyPath: "client_id" });
        }
        if (!database.objectStoreNames.contains(PRIVATE_CACHE_STORE)) {
          database.createObjectStore(PRIVATE_CACHE_STORE, { keyPath: "key" });
        }
        if (!database.objectStoreNames.contains(META_STORE)) {
          database.createObjectStore(META_STORE, { keyPath: "key" });
        }
      };
      request.onsuccess = () => {
        const database = request.result;
        database.onversionchange = () => {
          database.close();
          databasePromise = undefined;
          cryptoKeyPromise = undefined;
          migrationPromise = undefined;
        };
        resolve(database);
      };
      request.onerror = () => {
        databasePromise = undefined;
        reject(request.error ?? new Error("No se pudo abrir el almacenamiento offline."));
      };
      request.onblocked = () => {
        databasePromise = undefined;
        reject(new Error("El almacenamiento offline está bloqueado por otra pestaña."));
      };
    });
  }
  return databasePromise;
}

function transactionDone(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error ?? new Error("La transacción offline fue cancelada."));
    transaction.onerror = () => reject(transaction.error ?? new Error("Falló una transacción offline."));
  });
}

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Falló una operación del almacenamiento offline."));
  });
}

async function getFromStore(storeName, key) {
  const database = await openDatabase();
  const transaction = database.transaction(storeName, "readonly");
  const [result] = await Promise.all([
    requestResult(transaction.objectStore(storeName).get(key)),
    transactionDone(transaction),
  ]);
  return result;
}

async function getAllFromStore(storeName) {
  const database = await openDatabase();
  const transaction = database.transaction(storeName, "readonly");
  const [result] = await Promise.all([
    requestResult(transaction.objectStore(storeName).getAll()),
    transactionDone(transaction),
  ]);
  return result;
}

async function putMany(storeName, values) {
  if (!values.length) return;
  const database = await openDatabase();
  const transaction = database.transaction(storeName, "readwrite");
  const store = transaction.objectStore(storeName);
  values.forEach((value) => store.put(value));
  await transactionDone(transaction);
}

async function getCryptoKey() {
  if (!globalThis.crypto?.subtle) {
    throw new Error("Este navegador no ofrece Web Crypto. Usá HTTPS o localhost para guardar inspecciones.");
  }
  if (!cryptoKeyPromise) {
    cryptoKeyPromise = (async () => {
      const stored = await getFromStore(META_STORE, "encryption-key");
      if (stored?.value) return stored.value;

      const key = await crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"],
      );
      await putMany(META_STORE, [{ key: "encryption-key", value: key }]);
      return key;
    })().catch((error) => {
      cryptoKeyPromise = undefined;
      throw error;
    });
  }
  return cryptoKeyPromise;
}

async function encryptValue(value) {
  const key = await getCryptoKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(JSON.stringify(value));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);
  return { iv, ciphertext };
}

async function decryptValue(encrypted) {
  const key = await getCryptoKey();
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: encrypted.iv },
    key,
    encrypted.ciphertext,
  );
  return JSON.parse(new TextDecoder().decode(plaintext));
}

function readLegacyValue(key) {
  const raw = globalThis.localStorage?.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (cause) {
    throw new Error(`No se pudo migrar el dato local "${key}": JSON inválido.`, { cause });
  }
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]),
    );
  }
  return value;
}

async function migrateLegacyData() {
  if (migrationPromise) return migrationPromise;
  migrationPromise = (async () => {
    if (await getFromStore(META_STORE, "legacy-migrated")) return;
    const legacyQueue = readLegacyValue(LEGACY_KEYS.inspections);
    const legacyAffiliates = readLegacyValue(LEGACY_KEYS.affiliates);
    const legacyInspectors = readLegacyValue(LEGACY_KEYS.inspectors);
    if (legacyQueue !== null && !Array.isArray(legacyQueue)) {
      throw new Error("La cola local anterior tiene un formato inválido; no se modificaron sus datos.");
    }
    if (legacyAffiliates !== null && !Array.isArray(legacyAffiliates)) {
      throw new Error("La caché anterior de afiliados tiene un formato inválido; no se modificaron sus datos.");
    }
    if (legacyInspectors !== null && !Array.isArray(legacyInspectors)) {
      throw new Error("La caché anterior de inspectores tiene un formato inválido; no se modificaron sus datos.");
    }

    const existing = new Set((await getAllFromStore(INSPECTIONS_STORE)).map((item) => item.client_id));
    const records = [];
    for (const inspection of legacyQueue ?? []) {
      if (typeof inspection.client_id !== "string" || !inspection.client_id) {
        throw new Error("Una planilla anterior no tiene client_id y no se puede migrar con seguridad.");
      }
      if (existing.has(inspection.client_id)) continue;
      const createdAt = inspection.created_at ?? new Date().toISOString();
      records.push({
        client_id: inspection.client_id,
        status: "pending",
        created_at: createdAt,
        updated_at: createdAt,
        attempts: 0,
        next_attempt_at: 0,
        encrypted_data: await encryptValue({ inspection, last_error: null }),
      });
    }
    const cacheEntries = [];
    if (legacyAffiliates !== null) {
      cacheEntries.push({
        key: "affiliates",
        encrypted_data: await encryptValue(legacyAffiliates),
      });
    }
    if (legacyInspectors !== null) {
      cacheEntries.push({
        key: "inspectors",
        encrypted_data: await encryptValue(legacyInspectors),
      });
    }
    await putMany(INSPECTIONS_STORE, records);
    await putMany(PRIVATE_CACHE_STORE, cacheEntries);
    await putMany(META_STORE, [{ key: "legacy-migrated", value: true }]);
    Object.values(LEGACY_KEYS).forEach((key) => globalThis.localStorage?.removeItem(key));
  })().catch((error) => {
    migrationPromise = undefined;
    throw error;
  });
  return migrationPromise;
}

async function initializeStorage() {
  await openDatabase();
  await migrateLegacyData();
}

async function readInspection(record) {
  const decrypted = await decryptValue(record.encrypted_data);
  return {
    ...decrypted.inspection,
    sync_status: record.status,
    created_at: record.created_at,
    updated_at: record.updated_at,
    attempts: record.attempts,
    next_attempt_at: record.next_attempt_at,
    last_error: decrypted.last_error,
  };
}

export async function listOfflineInspections() {
  await initializeStorage();
  const records = await getAllFromStore(INSPECTIONS_STORE);
  const decrypted = await Promise.all(records.map(readInspection));
  return decrypted.sort((left, right) => right.created_at.localeCompare(left.created_at));
}

export async function readPendingInspections({ force = false } = {}) {
  const records = await listOfflineInspections();
  const now = Date.now();
  return records
    .filter((record) =>
      ["pending", "error"].includes(record.sync_status) &&
      (force || record.next_attempt_at <= now),
    )
    .sort((left, right) => left.created_at.localeCompare(right.created_at))
    .map(({ sync_status, created_at, updated_at, attempts, next_attempt_at, last_error, ...inspection }) =>
      inspection,
    );
}

export async function enqueueInspection(inspection) {
  if (typeof inspection.client_id !== "string" || !inspection.client_id) {
    throw new Error("La planilla necesita un client_id para guardarse.");
  }
  await initializeStorage();
  const existing = await getFromStore(INSPECTIONS_STORE, inspection.client_id);
  if (existing) {
    const saved = await readInspection(existing);
    const { sync_status, created_at, updated_at, attempts, next_attempt_at, last_error, ...savedInspection } = saved;
    if (JSON.stringify(canonicalize(savedInspection)) !== JSON.stringify(canonicalize(inspection))) {
      throw new Error("El client_id ya está asociado a otra planilla local.");
    }
    return listOfflineInspections();
  }
  const now = new Date().toISOString();
  await putMany(INSPECTIONS_STORE, [{
    client_id: inspection.client_id,
    status: "pending",
    created_at: now,
    updated_at: now,
    attempts: 0,
    next_attempt_at: 0,
    encrypted_data: await encryptValue({ inspection, last_error: null }),
  }]);
  return listOfflineInspections();
}

export async function markInspectionsSent(clientIds) {
  await initializeStorage();
  const ids = new Set(clientIds);
  const records = (await getAllFromStore(INSPECTIONS_STORE)).filter((record) => ids.has(record.client_id));
  const now = new Date().toISOString();
  records.forEach((record) => {
    record.status = "sent";
    record.updated_at = now;
    record.next_attempt_at = 0;
  });
  for (const record of records) {
    const data = await decryptValue(record.encrypted_data);
    data.last_error = null;
    record.encrypted_data = await encryptValue(data);
  }
  await putMany(INSPECTIONS_STORE, records);
  return listOfflineInspections();
}

export async function markInspectionsFailed(clientIds, message) {
  await initializeStorage();
  const ids = new Set(clientIds);
  const records = (await getAllFromStore(INSPECTIONS_STORE)).filter((record) => ids.has(record.client_id));
  const now = new Date();
  for (const record of records) {
    record.status = "error";
    record.attempts += 1;
    record.updated_at = now.toISOString();
    record.next_attempt_at = now.getTime() + Math.min(1000 * (2 ** Math.min(record.attempts, 10)), 15 * 60 * 1000);
    const data = await decryptValue(record.encrypted_data);
    data.last_error = message;
    record.encrypted_data = await encryptValue(data);
  }
  await putMany(INSPECTIONS_STORE, records);
  return listOfflineInspections();
}

export async function readCachedAffiliates() {
  await initializeStorage();
  const cached = await getFromStore(PRIVATE_CACHE_STORE, "affiliates");
  return cached ? decryptValue(cached.encrypted_data) : [];
}

export async function cacheAffiliates(affiliates) {
  if (!Array.isArray(affiliates)) throw new Error("La caché de afiliados debe ser una lista.");
  await initializeStorage();
  await putMany(PRIVATE_CACHE_STORE, [{
    key: "affiliates",
    encrypted_data: await encryptValue(affiliates),
  }]);
}

export async function readCachedInspectors() {
  await initializeStorage();
  const cached = await getFromStore(PRIVATE_CACHE_STORE, "inspectors");
  return cached ? decryptValue(cached.encrypted_data) : [];
}

export async function cacheInspectors(inspectors) {
  if (!Array.isArray(inspectors)) throw new Error("La caché de inspectores debe ser una lista.");
  await initializeStorage();
  await putMany(PRIVATE_CACHE_STORE, [{
    key: "inspectors",
    encrypted_data: await encryptValue(inspectors),
  }]);
}

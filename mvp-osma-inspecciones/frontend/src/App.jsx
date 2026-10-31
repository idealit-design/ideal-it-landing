import { useCallback, useEffect, useMemo, useState } from "react";

import {
  getInspections,
  getInspectors,
  searchAffiliates,
  syncInspections,
} from "./api.js";
import {
  cacheAffiliates,
  cacheInspectors,
  enqueueInspection,
  readCachedAffiliates,
  readCachedInspectors,
  readPendingInspections,
  removeSyncedInspections,
} from "./offlineStore.js";

const navigation = [
  { id: "nueva", label: "Nueva inspección", icon: "＋" },
  { id: "afiliados", label: "Afiliados", icon: "⌕" },
  { id: "historial", label: "Historial", icon: "▤" },
  { id: "sincronizacion", label: "Sincronización", icon: "⇅" },
];

const initialForm = {
  numero_acta: "",
  fecha_inspeccion: (() => {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  })(),
  direccion: "",
  nombre_contacto: "",
  cuit: "",
  tipo: "nueva",
  observacion1: "",
  observacion2: "",
};

function localClientId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  const values = crypto.getRandomValues(new Uint32Array(4));
  return Array.from(values, (value) => value.toString(16)).join("-");
}

function formatDate(value) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value.endsWith("Z") ? value : `${value}Z`));
}

function App() {
  const [activeView, setActiveView] = useState("nueva");
  const [inspectors, setInspectors] = useState(() => readCachedInspectors());
  const [affiliates, setAffiliates] = useState(() => readCachedAffiliates());
  const [inspections, setInspections] = useState([]);
  const [pending, setPending] = useState(() => readPendingInspections());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [selectedAffiliate, setSelectedAffiliate] = useState(null);
  const [affiliateQuery, setAffiliateQuery] = useState("");
  const [affiliateViewQuery, setAffiliateViewQuery] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const refreshFromApi = useCallback(async () => {
    const results = await Promise.allSettled([
      getInspectors(),
      getInspections(),
      searchAffiliates(),
    ]);
    const [inspectorResult, inspectionResult, affiliateResult] = results;
    const failures = [];

    if (inspectorResult.status === "fulfilled") {
      setInspectors(inspectorResult.value);
      cacheInspectors(inspectorResult.value);
    }
    else failures.push(inspectorResult.reason.message);

    if (inspectionResult.status === "fulfilled") setInspections(inspectionResult.value);
    else failures.push(inspectionResult.reason.message);

    if (affiliateResult.status === "fulfilled") {
      setAffiliates(affiliateResult.value);
      cacheAffiliates(affiliateResult.value);
    } else {
      failures.push(affiliateResult.reason.message);
    }

    if (failures.length) setError(`API no disponible; se conservan los datos locales. ${failures.join(" ")}`);
    else setError("");
  }, []);

  const synchronize = useCallback(async () => {
    const queued = readPendingInspections();
    if (!queued.length) {
      setMessage("No hay planillas pendientes de sincronización.");
      return;
    }
    if (!navigator.onLine) {
      setError("Sin conexión: las planillas siguen guardadas en este dispositivo.");
      return;
    }

    setIsSyncing(true);
    setError("");
    try {
      const result = await syncInspections(queued);
      const remaining = removeSyncedInspections(
        result.inspecciones.map((inspection) => inspection.client_id),
      );
      setPending(remaining);
      setMessage(
        `${result.creadas} planilla(s) sincronizada(s); ${result.duplicadas} ya estaban registradas.`,
      );
      await refreshFromApi();
    } catch (syncError) {
      setError(`${syncError.message} La cola local se conservó para reintentar.`);
    } finally {
      setIsSyncing(false);
    }
  }, [refreshFromApi]);

  useEffect(() => {
    void refreshFromApi();
    const updateConnection = () => {
      setIsOnline(navigator.onLine);
      if (navigator.onLine) {
        void refreshFromApi();
        void synchronize();
      }
    };
    window.addEventListener("online", updateConnection);
    window.addEventListener("offline", updateConnection);
    return () => {
      window.removeEventListener("online", updateConnection);
      window.removeEventListener("offline", updateConnection);
    };
  }, [refreshFromApi, synchronize]);

  useEffect(() => {
    if (!affiliateQuery.trim()) return undefined;
    const timer = window.setTimeout(async () => {
      try {
        const results = await searchAffiliates(affiliateQuery.trim());
        setAffiliates((current) => {
          const byDni = new Map(current.map((affiliate) => [affiliate.dni, affiliate]));
          results.forEach((affiliate) => byDni.set(affiliate.dni, affiliate));
          const updated = Array.from(byDni.values());
          cacheAffiliates(updated);
          return updated;
        });
      } catch (searchError) {
        if (searchError.name === "NetworkError") {
          setError("Sin conexión con la API; se muestran los afiliados previamente guardados.");
        } else {
          setError(searchError.message);
        }
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [affiliateQuery]);

  const visibleAffiliates = useMemo(() => {
    const query = affiliateViewQuery.trim().toLocaleLowerCase("es");
    if (!query) return affiliates;
    return affiliates.filter(
      (affiliate) =>
        affiliate.dni.includes(query) ||
        affiliate.nombre_apellido.toLocaleLowerCase("es").includes(query),
    );
  }, [affiliateViewQuery, affiliates]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!selectedAffiliate) {
      setError("Seleccioná un afiliado válido antes de guardar la planilla.");
      return;
    }
    if (selectedAffiliate.estado !== "ACTIVO") {
      setError("La cobertura del afiliado está suspendida; no se puede registrar la inspección.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const datosJson = Object.fromEntries(
      Object.keys(initialForm).map((field) => [field, formData.get(field) ?? ""]),
    );
    const observaciones = [datosJson.observacion1, datosJson.observacion2]
      .filter(Boolean)
      .map((value, index) => `Observación ${index + 1}: ${value}`)
      .join("\n");
    const inspection = {
      client_id: localClientId(),
      inspector_id: Number(formData.get("inspector_id")),
      afiliado_dni: selectedAffiliate.dni,
      fecha_inspeccion: new Date(datosJson.fecha_inspeccion).toISOString(),
      observaciones,
      datos_json: datosJson,
      estado_planillla: "PENDIENTE_SYNC",
    };

    try {
      const newQueue = enqueueInspection(inspection);
      setPending(newQueue);
      setSelectedAffiliate(null);
      setAffiliateQuery("");
      setFormKey((key) => key + 1);
      setMessage("Planilla guardada en este dispositivo.");
      if (navigator.onLine) await synchronize();
    } catch (saveError) {
      setError(`No se pudo guardar la planilla localmente: ${saveError.message}`);
    }
  };

  const chooseAffiliate = (affiliate) => {
    setSelectedAffiliate(affiliate);
    setAffiliateQuery(affiliate.dni);
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">O</div>
          <div>
            <strong>OSMA</strong>
            <span>Inspecciones</span>
          </div>
        </div>
        <div className="sidebar-label">OPERACIONES</div>
        <nav aria-label="Navegación principal">
          {navigation.map((item) => (
            <button
              className={`nav-item ${activeView === item.id ? "active" : ""}`}
              key={item.id}
              onClick={() => setActiveView(item.id)}
              type="button"
            >
              <span className="nav-icon" aria-hidden="true">{item.icon}</span>
              {item.label}
              {item.id === "sincronizacion" && pending.length > 0 && (
                <span className="nav-count">{pending.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <span className={`connection-dot ${isOnline ? "online" : ""}`} />
          <div>
            <strong>{isOnline ? "Conectado" : "Modo sin conexión"}</strong>
            <small>{pending.length} planilla(s) en este dispositivo</small>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">MÓDULO DE CAMPO · VERSIÓN 0.1.1</p>
            <h1>{navigation.find((item) => item.id === activeView)?.label}</h1>
          </div>
          <div className={`connection-pill ${isOnline ? "online" : "offline"}`}>
            <span className="connection-dot" />
            {isOnline ? "En línea" : "Sin conexión"}
          </div>
        </header>

        {error && <div className="alert alert-error" role="alert">{error}</div>}
        {message && <div className="alert alert-success" role="status">{message}</div>}

        {activeView === "nueva" && (
          <section className="content-grid">
            <div className="panel form-panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">CARGA DE CAMPO</p>
                  <h2>Datos de la planilla</h2>
                </div>
                <span className="panel-step">01 / 02</span>
              </div>
              <p className="panel-description">
                Completá la información del afiliado y transcribí los datos del acta física.
                La carga se conserva en este dispositivo si no hay señal.
              </p>
              <form key={formKey} className="inspection-form" onSubmit={handleSubmit}>
                <div className="field-group">
                  <label htmlFor="inspector_id">Inspector responsable</label>
                  <select id="inspector_id" name="inspector_id" required defaultValue="">
                    <option value="" disabled>Seleccionar inspector</option>
                    {inspectors.map((inspector) => (
                      <option key={inspector.id} value={inspector.id}>
                        {inspector.nombre} · {inspector.zona_asignada}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field-group affiliate-field">
                  <label htmlFor="afiliado_busqueda">Afiliado a inspeccionar</label>
                  <input
                    autoComplete="off"
                    id="afiliado_busqueda"
                    onChange={(event) => {
                      setAffiliateQuery(event.target.value);
                      setSelectedAffiliate(null);
                    }}
                    placeholder="Buscar por DNI o nombre"
                    value={affiliateQuery}
                  />
                  {affiliateQuery && !selectedAffiliate && (
                    <div className="affiliate-options">
                      {affiliates
                        .filter((affiliate) =>
                          affiliate.dni.includes(affiliateQuery) ||
                          affiliate.nombre_apellido.toLocaleLowerCase("es").includes(
                            affiliateQuery.toLocaleLowerCase("es"),
                          ),
                        )
                        .slice(0, 6)
                        .map((affiliate) => (
                          <button
                            key={affiliate.dni}
                            onClick={() => chooseAffiliate(affiliate)}
                            type="button"
                          >
                            <span>{affiliate.nombre_apellido}</span>
                            <small>DNI {affiliate.dni} · {affiliate.estado}</small>
                          </button>
                        ))}
                    </div>
                  )}
                  {selectedAffiliate && (
                    <div className={`affiliate-check ${selectedAffiliate.estado === "ACTIVO" ? "" : "suspended"}`}>
                      <span>{selectedAffiliate.estado === "ACTIVO" ? "Cobertura activa" : "Cobertura suspendida"}</span>
                      <strong>{selectedAffiliate.plan_social}</strong>
                    </div>
                  )}
                </div>

                <div className="form-section-title">
                  <span>Datos del acta</span>
                  <span>Campos de planilla física</span>
                </div>
                <div className="form-row">
                  <div className="field-group">
                    <label htmlFor="numero_acta">Número de acta</label>
                    <input id="numero_acta" name="numero_acta" maxLength="60" placeholder="Ej. 000123" required />
                  </div>
                  <div className="field-group">
                    <label htmlFor="fecha_inspeccion">Fecha de inspección</label>
                    <input
                      defaultValue={initialForm.fecha_inspeccion}
                      id="fecha_inspeccion"
                      name="fecha_inspeccion"
                      required
                      type="datetime-local"
                    />
                  </div>
                </div>
                <div className="field-group">
                  <label htmlFor="direccion">Dirección inspeccionada</label>
                  <input id="direccion" name="direccion" maxLength="240" placeholder="Calle, número y localidad" required />
                </div>
                <div className="form-row">
                  <div className="field-group">
                    <label htmlFor="nombre_contacto">Nombre del contacto</label>
                    <input id="nombre_contacto" name="nombre_contacto" maxLength="160" placeholder="Persona entrevistada" />
                  </div>
                  <div className="field-group">
                    <label htmlFor="cuit">CUIT</label>
                    <input id="cuit" name="cuit" inputMode="numeric" maxLength="20" placeholder="20-00000000-0" />
                  </div>
                </div>
                <div className="field-group">
                  <label htmlFor="tipo">Tipo de inspección</label>
                  <select defaultValue={initialForm.tipo} id="tipo" name="tipo">
                    <option value="nueva">Nueva</option>
                    <option value="informacion">Información</option>
                    <option value="deuda">Deuda</option>
                  </select>
                </div>
                <div className="field-group">
                  <label htmlFor="observacion1">Observación 1</label>
                  <textarea id="observacion1" name="observacion1" maxLength="5000" placeholder="Detalle de la visita o documentación relevada" rows="3" />
                </div>
                <div className="field-group">
                  <label htmlFor="observacion2">Observación 2</label>
                  <textarea id="observacion2" name="observacion2" maxLength="5000" placeholder="Información complementaria" rows="3" />
                </div>
                <button className="primary-button submit-button" type="submit">
                  Guardar planilla <span aria-hidden="true">→</span>
                </button>
              </form>
            </div>

            <aside className="side-column">
              <div className="summary-card">
                <div className="summary-icon">✓</div>
                <p className="eyebrow">ESTADO DE COBERTURA</p>
                <h3>{selectedAffiliate ? selectedAffiliate.estado : "Verificación requerida"}</h3>
                <p>
                  {selectedAffiliate
                    ? `${selectedAffiliate.nombre_apellido} · ${selectedAffiliate.plan_social}`
                    : "Buscá al afiliado para validar su plan y cobertura antes de cargar."}
                </p>
              </div>
              <div className="tip-card">
                <span className="tip-mark">i</span>
                <div>
                  <strong>Trabajo en zonas sin señal</strong>
                  <p>Las planillas se guardan en el dispositivo y se sincronizan al recuperar conexión.</p>
                </div>
              </div>
              <div className="mini-stat">
                <span className="mini-stat-icon">▤</span>
                <div><strong>{inspections.length + pending.length}</strong><small>Inspecciones registradas</small></div>
              </div>
            </aside>
          </section>
        )}

        {activeView === "afiliados" && (
          <section className="panel">
            <div className="panel-heading">
              <div><p className="eyebrow">CONSULTA DE COBERTURA</p><h2>Búsqueda de afiliados</h2></div>
            </div>
            <div className="search-box">
              <span aria-hidden="true">⌕</span>
              <input
                onChange={(event) => setAffiliateViewQuery(event.target.value)}
                placeholder="Ingresá DNI o nombre y apellido"
                value={affiliateViewQuery}
              />
              <span className="search-caption">{visibleAffiliates.length} resultado(s)</span>
            </div>
            <div className="affiliate-list">
              {visibleAffiliates.map((affiliate) => (
                <article className="affiliate-card" key={affiliate.dni}>
                  <div className="avatar">{affiliate.nombre_apellido.slice(0, 1)}</div>
                  <div className="affiliate-main">
                    <strong>{affiliate.nombre_apellido}</strong>
                    <span>DNI {affiliate.dni} · {affiliate.plan_social}</span>
                  </div>
                  <span className={`status-tag ${affiliate.estado === "ACTIVO" ? "active" : "suspended"}`}>
                    {affiliate.estado}
                  </span>
                </article>
              ))}
              {visibleAffiliates.length === 0 && (
                <div className="empty-state">No se encontraron afiliados en la caché disponible.</div>
              )}
            </div>
            <p className="privacy-note">La consulta se realiza contra la base local aislada de este MVP.</p>
          </section>
        )}

        {activeView === "historial" && (
          <section className="panel">
            <div className="panel-heading">
              <div><p className="eyebrow">ACTIVIDAD RECIENTE</p><h2>Inspecciones sincronizadas</h2></div>
              <button className="secondary-button" onClick={() => void refreshFromApi()} type="button">Actualizar</button>
            </div>
            <div className="inspection-list">
              {inspections.map((inspection) => (
                <article className="inspection-card" key={inspection.id}>
                  <div className="inspection-date">{formatDate(inspection.fecha_inspeccion)}</div>
                  <div className="inspection-main">
                    <strong>Acta {inspection.datos_json.numero_acta || `#${inspection.id}`}</strong>
                    <span>{inspection.afiliado_nombre} · DNI {inspection.afiliado_dni}</span>
                    <small>{inspection.datos_json.direccion || "Sin dirección"} · {inspection.inspector_nombre}</small>
                  </div>
                  <span className={`status-tag ${inspection.estado_planillla === "COMPLETA" ? "active" : "pending"}`}>
                    {inspection.estado_planillla === "COMPLETA" ? "COMPLETA" : "PENDIENTE"}
                  </span>
                </article>
              ))}
              {inspections.length === 0 && (
                <div className="empty-state">Todavía no hay inspecciones sincronizadas con la API.</div>
              )}
            </div>
          </section>
        )}

        {activeView === "sincronizacion" && (
          <section className="panel sync-panel">
            <div className="panel-heading">
              <div><p className="eyebrow">COLA LOCAL DE ENVÍO</p><h2>Sincronización de planillas</h2></div>
            </div>
            <div className="sync-status-card">
              <div className={`sync-illustration ${isOnline ? "online" : ""}`}>⇅</div>
              <div>
                <strong>{pending.length} planilla(s) pendiente(s)</strong>
                <p>{isOnline ? "Conexión disponible para enviar cargas locales." : "Sin conexión. Tus datos permanecen guardados en este dispositivo."}</p>
              </div>
              <button
                className="primary-button"
                disabled={!isOnline || isSyncing || pending.length === 0}
                onClick={() => void synchronize()}
                type="button"
              >
                {isSyncing ? "Sincronizando…" : "Sincronizar ahora"}
              </button>
            </div>
            <div className="queued-list">
              {pending.map((inspection) => (
                <article className="inspection-card" key={inspection.client_id}>
                  <div className="pending-indicator">•••</div>
                  <div className="inspection-main">
                    <strong>Acta {inspection.datos_json.numero_acta}</strong>
                    <span>DNI {inspection.afiliado_dni} · {inspection.datos_json.direccion}</span>
                    <small>{formatDate(inspection.fecha_inspeccion)}</small>
                  </div>
                  <span className="status-tag pending">PENDIENTE</span>
                </article>
              ))}
              {pending.length === 0 && <div className="empty-state">La cola local está vacía.</div>}
            </div>
          </section>
        )}

        <footer className="app-footer">
          <span>OSMA Inspecciones · MVP 0.1.1</span>
          <span>Datos locales de demostración</span>
        </footer>
      </main>
    </div>
  );
}

export default App;

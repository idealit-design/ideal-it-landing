import { useCallback, useEffect, useMemo, useState } from "react";

const API_URL = "http://127.0.0.1:8765";
const REFRESH_INTERVAL_MS = 15_000;

const serviceIcons = {
  personal: "👥",
  auditoria: "◈",
  formularios: "▣",
  "valentin-cripto": "⌁",
  inspecciones: "⌖",
  "logistica-fleet": "◉",
  "agrotech-iot": "⌘",
  "visitor-pass": "↗",
};

function formatTime(value) {
  if (!value) return "Esperando primera lectura";
  return new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}

function StatusPill({ online, label }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
        online
          ? "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-300"
          : "border-rose-400/20 bg-rose-400/[0.08] text-rose-300"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${online ? "bg-emerald-400" : "bg-rose-400"}`} />
      {label}
    </span>
  );
}

function ServiceCard({ service }) {
  const online = service.status === "online";
  const demo = new URL(service.demo_url);
  const backendLabel = service.health_ok === null
    ? `Puerto ${service.frontend_port ?? service.api_port}`
    : `API ${service.api_port}`;

  return (
    <article className="service-card group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111827]/90 p-5 transition duration-200 hover:-translate-y-0.5 hover:border-white/[0.14]">
      <div className={`absolute inset-x-0 top-0 h-px ${online ? "bg-gradient-to-r from-transparent via-emerald-400/70 to-transparent" : "bg-gradient-to-r from-transparent via-rose-400/70 to-transparent"}`} />
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-white/[0.07] bg-white/[0.035] text-lg text-cyan-100">
            {serviceIcons[service.id] ?? "◇"}
          </div>
          <div className="min-w-0">
            <h3 className="truncate font-semibold tracking-tight text-slate-100">{service.name}</h3>
            <p className="mt-1 truncate text-xs text-slate-500">{service.description}</p>
          </div>
        </div>
        <StatusPill online={online} label={online ? "ONLINE" : "OFFLINE"} />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-white/[0.05] bg-[#0b111d]/70 px-3 py-2.5">
          <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Respuesta</div>
          <div className="mt-1.5 font-mono text-sm text-slate-200">
            {service.latency_ms == null ? "—" : `${service.latency_ms} ms`}
          </div>
        </div>
        <div className="rounded-xl border border-white/[0.05] bg-[#0b111d]/70 px-3 py-2.5">
          <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Memoria estimada</div>
          <div className="mt-1.5 font-mono text-sm text-slate-200">
            {service.memory_mb == null ? "Sin dato" : `${service.memory_mb} MB`}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="rounded-md border border-white/[0.06] bg-white/[0.025] px-2 py-1 font-mono text-[10px] text-slate-400">
          {backendLabel}
          {service.health_status ? ` · HTTP ${service.health_status}` : ""}
        </span>
        {service.frontend_port != null && (
          <span className={`rounded-md border px-2 py-1 font-mono text-[10px] ${
            service.frontend_port_open
              ? "border-cyan-400/15 bg-cyan-400/[0.05] text-cyan-200/80"
              : "border-white/[0.06] bg-white/[0.025] text-slate-500"
          }`}>
            UI {service.frontend_port_open ? "disponible" : "sin respuesta"}
          </span>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-white/[0.06] pt-4">
        <span className="font-mono text-[10px] text-slate-600">{demo.host}</span>
        <a
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-300 transition hover:text-cyan-200"
          href={service.demo_url}
          target="_blank"
          rel="noreferrer"
        >
          {service.demo_label}
          <span aria-hidden="true">↗</span>
        </a>
      </div>
    </article>
  );
}

function IncidentRow({ incident }) {
  const isOffline = incident.current_status === "offline";
  return (
    <div className="flex items-center gap-3 border-b border-white/[0.05] py-3 last:border-0">
      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs ${
        isOffline ? "bg-rose-400/10 text-rose-300" : "bg-emerald-400/10 text-emerald-300"
      }`}>
        {isOffline ? "↓" : "↑"}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-slate-200">{incident.service_name}</div>
        <div className="mt-0.5 text-xs text-slate-500">
          {incident.previous_status
            ? `${incident.previous_status} → ${incident.current_status}`
            : `Estado inicial: ${incident.current_status}`}
        </div>
      </div>
      <time className="shrink-0 font-mono text-[10px] text-slate-500">
        {formatTime(incident.occurred_at)}
      </time>
    </div>
  );
}

export default function App() {
  const [services, setServices] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [checkedAt, setCheckedAt] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertBusy, setAlertBusy] = useState(false);
  const [filter, setFilter] = useState("all");

  const refresh = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    try {
      const [serviceResponse, incidentResponse] = await Promise.all([
        fetch(`${API_URL}/api/services`),
        fetch(`${API_URL}/api/incidents?limit=8`),
      ]);
      if (!serviceResponse.ok || !incidentResponse.ok) {
        throw new Error("La API del monitor devolvió un error.");
      }
      const [serviceReport, incidentReport] = await Promise.all([
        serviceResponse.json(),
        incidentResponse.json(),
      ]);
      setServices(serviceReport.services);
      setCheckedAt(serviceReport.checked_at);
      setIncidents(incidentReport.incidents);
      setError("");
    } catch (requestError) {
      setError(`${requestError.message} Inicia el backend en 127.0.0.1:8765.`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const timer = window.setInterval(() => refresh(true), REFRESH_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const counts = useMemo(() => ({
    total: services.length,
    online: services.filter((service) => service.status === "online").length,
    offline: services.filter((service) => service.status !== "online").length,
  }), [services]);
  const visibleServices = services.filter((service) => (
    filter === "all" || service.status === filter
  ));

  async function simulateWebhook() {
    setAlertBusy(true);
    setAlertMessage("");
    try {
      const response = await fetch(`${API_URL}/api/alerts/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!response.ok) throw new Error("No se pudo registrar la simulación.");
      const result = await response.json();
      setAlertMessage(`Alerta simulada #${result.id} registrada en SQLite. Sin envío externo.`);
    } catch (requestError) {
      setAlertMessage(requestError.message);
    } finally {
      setAlertBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#090d18] text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_50%_-20%,rgba(27,99,130,0.16),transparent_55%)]" />
      <div className="relative mx-auto max-w-[1440px] px-5 py-7 sm:px-8 lg:px-10 lg:py-10">
        <header className="flex flex-col justify-between gap-6 border-b border-white/[0.07] pb-7 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.07] text-xl text-cyan-200 shadow-[0_0_30px_rgba(34,211,238,0.08)]">
              ◉
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">Ideal-IT / DevOps</span>
                <span className="rounded border border-white/[0.08] px-1.5 py-0.5 text-[9px] font-semibold tracking-wider text-slate-500">LOCAL</span>
              </div>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-[28px]">Mission Control</h1>
              <p className="mt-1 text-xs text-slate-500">Centro de salud del ecosistema MVP</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-3.5 py-2.5">
              <div className="text-[9px] font-semibold uppercase tracking-[0.15em] text-slate-500">Última lectura</div>
              <div className="mt-1 font-mono text-xs text-slate-300">{formatTime(checkedAt)}</div>
            </div>
            <button
              className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-300/[0.08] px-4 py-3 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-300/[0.14] disabled:opacity-50"
              onClick={() => refresh(true)}
              disabled={refreshing}
            >
              <span className={refreshing ? "animate-spin" : ""}>⟳</span>
              Actualizar
            </button>
          </div>
        </header>

        {error && (
          <div className="mt-6 rounded-xl border border-rose-300/20 bg-rose-300/[0.06] px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        )}

        <section className="mt-7 grid gap-4 sm:grid-cols-3">
          <div className="metric-card rounded-2xl border border-white/[0.07] bg-[#111827]/80 p-5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              Servicios registrados <span className="text-slate-600">◈</span>
            </div>
            <div className="mt-3 text-3xl font-semibold tracking-tight">{loading ? "—" : counts.total}</div>
            <div className="mt-2 text-[11px] text-slate-500">MVPs encontrados en el monorepo</div>
          </div>
          <div className="metric-card rounded-2xl border border-emerald-400/10 bg-[#111827]/80 p-5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              En línea <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.6)]" />
            </div>
            <div className="mt-3 text-3xl font-semibold tracking-tight text-emerald-300">{loading ? "—" : counts.online}</div>
            <div className="mt-2 text-[11px] text-slate-500">Health check exitoso</div>
          </div>
          <div className="metric-card rounded-2xl border border-rose-400/10 bg-[#111827]/80 p-5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              Fuera de línea <span className="h-2 w-2 rounded-full bg-rose-400/80" />
            </div>
            <div className="mt-3 text-3xl font-semibold tracking-tight text-rose-300">{loading ? "—" : counts.offline}</div>
            <div className="mt-2 text-[11px] text-slate-500">Sin respuesta o health check fallido</div>
          </div>
        </section>

        <section className="mt-9">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300/80">Infraestructura local</div>
              <h2 className="mt-1 text-lg font-semibold tracking-tight">Servicios monitoreados</h2>
            </div>
            <div className="flex items-center gap-1 rounded-xl border border-white/[0.06] bg-white/[0.025] p-1">
              {[
                ["all", "Todos"],
                ["online", "Online"],
                ["offline", "Offline"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  className={`rounded-lg px-3 py-1.5 text-[11px] font-medium transition ${
                    filter === value ? "bg-white/[0.09] text-slate-100" : "text-slate-500 hover:text-slate-300"
                  }`}
                  onClick={() => setFilter(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {loading && services.length === 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }, (_, index) => (
                <div key={index} className="h-48 animate-pulse rounded-2xl border border-white/[0.05] bg-white/[0.025]" />
              ))}
            </div>
          ) : visibleServices.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visibleServices.map((service) => <ServiceCard key={service.id} service={service} />)}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-10 text-center text-sm text-slate-500">
              No hay servicios para este filtro.
            </div>
          )}
        </section>

        <section className="mt-9 grid gap-5 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="rounded-2xl border border-white/[0.07] bg-[#111827]/80 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300/80">Registro local</div>
                <h2 className="mt-1 text-base font-semibold">Incidentes de disponibilidad</h2>
              </div>
              <span className="rounded-lg border border-white/[0.06] px-2.5 py-1 text-[10px] text-slate-500">SQLite · últimos 8</span>
            </div>
            <div className="mt-3">
              {incidents.length ? incidents.map((incident) => (
                <IncidentRow key={incident.id} incident={incident} />
              )) : (
                <p className="py-8 text-center text-sm text-slate-500">Aún no hay cambios de estado registrados.</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-cyan-300/10 bg-gradient-to-br from-cyan-300/[0.06] to-[#111827]/90 p-5 sm:p-6">
            <div className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-300/15 bg-cyan-300/[0.07] text-lg text-cyan-200">⌁</div>
            <h2 className="mt-4 text-base font-semibold">Simulador de alertas webhook</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Genera un payload del estado actual y lo registra localmente. No realiza solicitudes a Internet.
            </p>
            <button
              className="mt-5 w-full rounded-xl border border-cyan-300/20 bg-cyan-300/[0.09] px-4 py-3 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-300/[0.15] disabled:opacity-50"
              onClick={simulateWebhook}
              disabled={alertBusy || services.length === 0}
            >
              {alertBusy ? "Simulando..." : "Simular alerta"}
            </button>
            {alertMessage && <p className="mt-3 text-xs leading-5 text-cyan-100/80">{alertMessage}</p>}
            <div className="mt-5 border-t border-white/[0.07] pt-4 text-[10px] leading-5 text-slate-500">
              Sondeo cada 15 s · solo loopback · sin cambios en los MVP monitoreados
            </div>
          </div>
        </section>

        <footer className="mt-8 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] pt-5 text-[10px] text-slate-600">
          <span>IDEAL-IT · SERVICE DEVOPS MONITOR</span>
          <span>Uso de memoria estimado según el proceso que escucha el puerto API.</span>
        </footer>
      </div>
    </main>
  );
}

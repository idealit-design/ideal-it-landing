import { useEffect, useState } from "react";

import {
  createAppointment,
  createApplication,
  createClaim,
  getDashboard,
  getApplicationTypes,
  getTracking,
} from "./api.js";

const EMPTY_DASHBOARD = { tramites: [], reclamos: [], turnos: [] };
const NAV_ITEMS = [
  ["inicio", "Inicio"],
  ["reclamo", "Nuevo reclamo"],
  ["tramite", "Nuevo trámite"],
  ["seguimiento", "Seguimiento"],
  ["turno", "Turnos"],
];

function formatDate(value) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function Login({ onLogin }) {
  const [documento, setDocumento] = useState("");
  const [nombre, setNombre] = useState("");

  function submit(event) {
    event.preventDefault();
    onLogin({ documento, nombre: nombre.trim() });
  }

  return (
    <main className="login-page">
      <section className="login-card card border-0 shadow-sm">
        <div className="brand-mark" aria-hidden="true">PC</div>
        <p className="eyebrow mb-2">SERVICIOS DIGITALES</p>
        <h1 className="h3 mb-2">Portal Ciudadano</h1>
        <p className="text-secondary mb-4">
          Ingresá para consultar tus gestiones y solicitar atención.
        </p>
        <form onSubmit={submit} className="vstack gap-3">
          <label className="form-label mb-0" htmlFor="login-documento">
            DNI o CUIT
            <input
              id="login-documento"
              className="form-control mt-2"
              inputMode="numeric"
              minLength="7"
              maxLength="11"
              pattern="[0-9]{7,11}"
              placeholder="Ej. 30123456789"
              required
              value={documento}
              onChange={(event) => setDocumento(event.target.value)}
            />
          </label>
          <label className="form-label mb-0" htmlFor="login-nombre">
            Nombre para la demostración
            <input
              id="login-nombre"
              className="form-control mt-2"
              minLength="2"
              maxLength="120"
              placeholder="Ej. Alex Ciudadano"
              required
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
            />
          </label>
          <button className="btn btn-primary btn-lg mt-2" type="submit">
            Ingresar al portal
          </button>
        </form>
        <div className="alert alert-info mt-4 mb-0 small" role="note">
          Acceso de demostración: no verifica identidad. Usá datos ficticios.
        </div>
      </section>
    </main>
  );
}

function StatusBadge({ children }) {
  const resolved = children === "Resuelto";
  return (
    <span className={`badge rounded-pill ${resolved ? "text-bg-success" : "status-badge"}`}>
      {children}
    </span>
  );
}

function RequestCard({ item, kind, onTrack }) {
  const title = kind === "Trámite" ? item.tipo : item.asunto;
  return (
    <article className="request-card">
      <div className="d-flex justify-content-between align-items-start gap-3">
        <div>
          <span className="eyebrow">{kind} · {item.codigo}</span>
          <h3 className="h6 mt-2 mb-1">{title}</h3>
          <p className="text-secondary small mb-0">{formatDate(item.creado_en)}</p>
        </div>
        <StatusBadge>{item.estado}</StatusBadge>
      </div>
      <button className="btn btn-link btn-sm px-0 mt-2" onClick={() => onTrack(item.codigo)}>
        Ver seguimiento <span aria-hidden="true">→</span>
      </button>
    </article>
  );
}

function Dashboard({ dashboard, onTrack }) {
  const requests = [
    ...dashboard.tramites.map((item) => ({ ...item, kind: "Trámite" })),
    ...dashboard.reclamos.map((item) => ({ ...item, kind: "Reclamo" })),
  ].sort((a, b) => new Date(b.creado_en) - new Date(a.creado_en));

  return (
    <>
      <div className="page-heading">
        <p className="eyebrow mb-2">TU ESPACIO</p>
        <h1 className="h2">Resumen de gestiones</h1>
        <p className="text-secondary mb-0">Consultá el estado de tus trámites y solicitudes.</p>
      </div>
      <div className="row g-3 mb-4">
        {[
          ["Trámites", dashboard.tramites.length],
          ["Reclamos", dashboard.reclamos.length],
          ["Turnos reservados", dashboard.turnos.length],
        ].map(([label, count]) => (
          <div className="col-12 col-md-4" key={label}>
            <div className="stat-card">
              <span className="text-secondary">{label}</span>
              <strong>{count}</strong>
            </div>
          </div>
        ))}
      </div>
      <section className="content-card">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="h5 mb-0">Trámites activos</h2>
          <span className="small text-secondary">{requests.length} gestiones</span>
        </div>
        {requests.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon" aria-hidden="true">○</span>
            <h3 className="h6">Todavía no tenés gestiones</h3>
            <p className="text-secondary mb-0">Cuando inicies un trámite o reclamo, aparecerá acá.</p>
          </div>
        ) : (
          <div className="request-list">
            {requests.map((item) => (
              <RequestCard key={item.codigo} item={item} kind={item.kind} onTrack={onTrack} />
            ))}
          </div>
        )}
      </section>
      {dashboard.turnos.length > 0 && (
        <section className="content-card mt-3">
          <h2 className="h5 mb-3">Próximos turnos</h2>
          <div className="request-list">
            {dashboard.turnos.map((turno) => (
              <article className="request-card d-flex justify-content-between gap-3" key={turno.codigo}>
                <div>
                  <span className="eyebrow">{turno.codigo}</span>
                  <h3 className="h6 mt-2 mb-1">{turno.motivo}</h3>
                  <p className="text-secondary small mb-0">{turno.sede}</p>
                </div>
                <span className="small text-secondary text-end">{formatDate(turno.fecha_hora)}</span>
              </article>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function ClaimForm({ citizen, onCreated, onError }) {
  const [form, setForm] = useState({ asunto: "", descripcion: "", ubicacion: "" });
  const [busy, setBusy] = useState(false);

  function update(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const result = await createClaim({ ...form, ...citizen });
      onCreated(`Reclamo registrado. Tu código de seguimiento es ${result.codigo}.`);
    } catch (requestError) {
      onError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <FormPage
      eyebrow="ATENCIÓN CIUDADANA"
      title="Nuevo reclamo"
      description="Contanos qué sucede para que el área correspondiente pueda revisarlo."
      onSubmit={submit}
      busy={busy}
      button="Enviar reclamo"
    >
      <TextField label="Asunto" name="asunto" value={form.asunto} onChange={update} required maxLength={120} />
      <TextField
        label="Descripción"
        name="descripcion"
        value={form.descripcion}
        onChange={update}
        required
        maxLength={2000}
        rows={4}
      />
      <label className="form-label">
        Ubicación de referencia
        <div className="input-group mt-2">
          <input
            className="form-control"
            name="ubicacion"
            maxLength="180"
            placeholder="Barrio, calle o punto de referencia"
            value={form.ubicacion}
            onChange={update}
          />
          <button
            className="btn btn-outline-secondary"
            type="button"
            onClick={() => setForm({ ...form, ubicacion: "Ubicación simulada: -34.6037, -58.3816" })}
          >
            Usar ubicación simulada
          </button>
        </div>
        <span className="form-text">No se consulta el GPS del dispositivo.</span>
      </label>
    </FormPage>
  );
}

function ApplicationForm({ citizen, onCreated, onError }) {
  const [form, setForm] = useState({ tipo_id: "", descripcion: "" });
  const [types, setTypes] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getApplicationTypes()
      .then(setTypes)
      .catch((requestError) => onError(requestError.message));
  }, [onError]);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const result = await createApplication({
        ...form,
        tipo_id: Number(form.tipo_id),
        ...citizen,
      });
      onCreated(`Trámite iniciado. Tu código de seguimiento es ${result.codigo}.`);
    } catch (requestError) {
      onError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <FormPage
      eyebrow="GESTIONES"
      title="Iniciar un trámite"
      description="Registrá una solicitud y recibí un código para consultar su avance."
      onSubmit={submit}
      busy={busy}
      disabled={types.length === 0}
      button="Iniciar trámite"
    >
      <label className="form-label">
        Tipo de trámite
        <select
          className="form-control mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 shadow-sm transition focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
          name="tipo_id"
          value={form.tipo_id}
          onChange={(event) => setForm({ ...form, tipo_id: event.target.value })}
          required
        >
          <option value="" disabled>
            {types.length > 0 ? "Seleccioná una opción" : "Cargando tipos de trámite…"}
          </option>
          {types.map((type) => (
            <option value={type.id} key={type.id}>{type.nombre}</option>
          ))}
        </select>
      </label>
      <TextField
        label="Descripción"
        name="descripcion"
        value={form.descripcion}
        onChange={(event) => setForm({ ...form, descripcion: event.target.value })}
        required
        maxLength={2000}
        rows={4}
      />
    </FormPage>
  );
}

function TextField({ label, rows, ...props }) {
  const Component = rows ? "textarea" : "input";
  return (
    <label className="form-label">
      {label}
      <Component className="form-control mt-2" rows={rows} {...props} />
    </label>
  );
}

function FormPage({
  eyebrow,
  title,
  description,
  onSubmit,
  busy,
  disabled = false,
  button,
  children,
}) {
  return (
    <section className="content-card form-page">
      <div className="page-heading">
        <p className="eyebrow mb-2">{eyebrow}</p>
        <h1 className="h2">{title}</h1>
        <p className="text-secondary mb-0">{description}</p>
      </div>
      <form className="vstack gap-3" onSubmit={onSubmit}>
        {children}
        <button
          className="btn btn-primary align-self-start px-4"
          disabled={busy || disabled}
          type="submit"
        >
          {busy ? "Enviando…" : button}
        </button>
      </form>
    </section>
  );
}

function Tracking({ initialCode }) {
  const [codigo, setCodigo] = useState(initialCode ?? "");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (initialCode) search(initialCode);
  }, [initialCode]);

  async function search(code = codigo) {
    if (!code.trim()) return;
    setBusy(true);
    setError("");
    setResult(null);
    try {
      setResult(await getTracking(code.trim()));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="page-heading">
        <p className="eyebrow mb-2">SEGUIMIENTO</p>
        <h1 className="h2">Consultá tu gestión</h1>
        <p className="text-secondary mb-0">Ingresá el código recibido al registrar el trámite o reclamo.</p>
      </div>
      <section className="content-card">
        <form
          className="tracking-form"
          onSubmit={(event) => {
            event.preventDefault();
            search();
          }}
        >
          <label className="form-label flex-grow-1 mb-0">
            Código de seguimiento
            <input
              className="form-control mt-2"
              placeholder="Ej. REC-A1B2C3D4"
              value={codigo}
              onChange={(event) => setCodigo(event.target.value)}
            />
          </label>
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? "Buscando…" : "Consultar"}
          </button>
        </form>
        {error && <div className="alert alert-warning mt-4 mb-0" role="alert">{error}</div>}
      </section>
      {result && (
        <section className="content-card mt-3">
          <div className="d-flex justify-content-between align-items-start gap-3">
            <div>
              <p className="eyebrow mb-2">{result.recurso} · {result.codigo}</p>
              <h2 className="h5 mb-1">{result.titulo}</h2>
              <p className="text-secondary">{result.descripcion}</p>
            </div>
            <StatusBadge>{result.estado_actual}</StatusBadge>
          </div>
          <h3 className="h6 mt-4">Etapas del seguimiento</h3>
          <ol className="timeline">
            {result.historial.map((item, index) => (
              <li className="timeline-item" key={`${item.estado}-${item.actualizado_en}-${index}`}>
                <span className="timeline-dot" aria-hidden="true" />
                <div>
                  <strong>{item.estado}</strong>
                  <p className="small text-secondary mb-1">{item.descripcion}</p>
                  <span className="small text-secondary">{formatDate(item.actualizado_en)}</span>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}
    </>
  );
}

function AppointmentForm({ citizen, appointments, onCreated, onError }) {
  const [form, setForm] = useState({ motivo: "", fecha_hora: "", sede: "Sede central" });
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const result = await createAppointment({
        ...form,
        ...citizen,
        fecha_hora: new Date(form.fecha_hora).toISOString(),
      });
      onCreated(`Turno reservado con código ${result.codigo}.`);
      setForm({ motivo: "", fecha_hora: "", sede: "Sede central" });
    } catch (requestError) {
      onError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <FormPage
        eyebrow="ATENCIÓN PRESENCIAL"
        title="Reservar un turno"
        description="Elegí el motivo, una fecha y la sede para tu atención."
        onSubmit={submit}
        busy={busy}
        button="Confirmar turno"
      >
        <TextField
          label="Motivo"
          name="motivo"
          value={form.motivo}
          onChange={(event) => setForm({ ...form, motivo: event.target.value })}
          required
          maxLength={100}
          placeholder="Ej. Consulta de trámite"
        />
        <TextField
          label="Fecha y hora"
          name="fecha_hora"
          type="datetime-local"
          value={form.fecha_hora}
          onChange={(event) => setForm({ ...form, fecha_hora: event.target.value })}
          required
        />
        <TextField
          label="Sede"
          name="sede"
          value={form.sede}
          onChange={(event) => setForm({ ...form, sede: event.target.value })}
          required
          maxLength={120}
        />
      </FormPage>
      {appointments.length > 0 && (
        <section className="content-card mt-3">
          <h2 className="h5 mb-3">Turnos reservados</h2>
          <div className="request-list">
            {appointments.map((turno) => (
              <article className="request-card d-flex justify-content-between gap-3" key={turno.codigo}>
                <div>
                  <span className="eyebrow">{turno.codigo}</span>
                  <h3 className="h6 mt-2 mb-1">{turno.motivo}</h3>
                  <p className="text-secondary small mb-0">{turno.sede}</p>
                </div>
                <span className="small text-secondary text-end">{formatDate(turno.fecha_hora)}</span>
              </article>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

export default function App() {
  const [citizen, setCitizen] = useState(null);
  const [page, setPage] = useState("inicio");
  const [dashboard, setDashboard] = useState(EMPTY_DASHBOARD);
  const [trackingCode, setTrackingCode] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function refreshDashboard(documento = citizen?.documento) {
    if (!documento) return;
    setError("");
    try {
      setDashboard(await getDashboard(documento));
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  useEffect(() => {
    if (citizen) refreshDashboard(citizen.documento);
  }, [citizen]);

  function handleCreated(message) {
    setNotice(message);
    setError("");
    setPage("inicio");
    refreshDashboard();
  }

  if (!citizen) {
    return (
      <Login
        onLogin={(person) => {
          setDashboard(EMPTY_DASHBOARD);
          setCitizen(person);
        }}
      />
    );
  }

  let content;
  if (page === "inicio") content = <Dashboard dashboard={dashboard} onTrack={(code) => {
    setTrackingCode(code);
    setPage("seguimiento");
  }} />;
  if (page === "reclamo") content = (
    <ClaimForm citizen={citizen} onCreated={handleCreated} onError={setError} />
  );
  if (page === "tramite") content = (
    <ApplicationForm citizen={citizen} onCreated={handleCreated} onError={setError} />
  );
  if (page === "seguimiento") content = <Tracking initialCode={trackingCode} />;
  if (page === "turno") {
    content = (
      <AppointmentForm
        citizen={citizen}
        appointments={dashboard.turnos}
        onCreated={handleCreated}
        onError={setError}
      />
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="sidebar-brand" href="#inicio" onClick={() => setPage("inicio")}>
          <span className="brand-mark brand-mark-small">PC</span>
          <span><strong>Portal</strong><small>Ciudadano</small></span>
        </a>
        <nav className="side-nav" aria-label="Navegación principal">
          {NAV_ITEMS.map(([key, label]) => (
            <button
              className={`side-link ${page === key ? "active" : ""}`}
              key={key}
              onClick={() => {
                setPage(key);
                setNotice("");
                setError("");
              }}
            >
              <span className="nav-indicator" aria-hidden="true" />
              {label}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="user-chip">
            <span className="user-avatar">{citizen.nombre.slice(0, 1).toUpperCase()}</span>
            <span className="user-details"><strong>{citizen.nombre}</strong><small>DNI/CUIT {citizen.documento}</small></span>
          </div>
          <button className="btn btn-sm btn-outline-light mt-3 w-100" onClick={() => {
            setCitizen(null);
            setDashboard(EMPTY_DASHBOARD);
          }}>
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="main-panel">
        <header className="topbar">
          <span className="small text-secondary">Portal de servicios · Entorno de demostración</span>
          <span className="demo-pill"><span /> Datos de prueba</span>
        </header>
        <div className="page-content">
          {notice && <div className="alert alert-success" role="status">{notice}</div>}
          {error && <div className="alert alert-warning" role="alert">{error}</div>}
          {content}
        </div>
        <footer className="app-footer">Portal Ciudadano · Versión 0.1.0 · Prototipo local</footer>
      </main>
    </div>
  );
}

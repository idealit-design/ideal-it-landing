import { FormEvent, useCallback, useEffect, useState } from "react";
import { api, CatalogItem, Intake, Processing, Provider, Report, Stock } from "./api";

type View = "resumen" | "stock" | "ingresos" | "trazabilidad" | "maestros";

const viewLabels: Record<View, string> = {
  resumen: "Resumen",
  stock: "Stock",
  ingresos: "Ingresos",
  trazabilidad: "Trazabilidad",
  maestros: "Catálogo y proveedores",
};

const number = (value: number) =>
  new Intl.NumberFormat("es-AR", { maximumFractionDigits: 3 }).format(value);

function App() {
  const [view, setView] = useState<View>("resumen");
  const [report, setReport] = useState<Report | null>(null);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [intakes, setIntakes] = useState<Intake[]>([]);
  const [processing, setProcessing] = useState<Processing[]>([]);
  const [stock, setStock] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [nextReport, nextCatalog, nextProviders, nextIntakes, nextProcessing, nextStock] =
        await Promise.all([
          api<Report>("/api/reportes/operativo"),
          api<CatalogItem[]>("/api/catalogo?activo=true"),
          api<Provider[]>("/api/proveedores?activo=true"),
          api<Intake[]>("/api/ingresos"),
          api<Processing[]>("/api/despostes"),
          api<Stock[]>("/api/saldos"),
        ]);
      setReport(nextReport);
      setCatalog(nextCatalog);
      setProviders(nextProviders);
      setIntakes(nextIntakes);
      setProcessing(nextProcessing);
      setStock(nextStock);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo cargar la API local.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function submitIntake(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      await api<Intake>("/api/ingresos", {
        method: "POST",
        body: JSON.stringify({
          proveedor_id: Number(form.get("proveedor_id")),
          catalogo_id: Number(form.get("catalogo_id")),
          fecha_faena: form.get("fecha_faena"),
          numero_tropa: form.get("numero_tropa"),
          numero_garron: form.get("numero_garron"),
          lateralidad: form.get("lateralidad"),
          peso_kg: Number(form.get("peso_kg")),
          observaciones: form.get("observaciones") || null,
        }),
      });
      formElement.reset();
      setNotice("Ingreso registrado y saldo de cámara actualizado.");
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo registrar el ingreso.");
    }
  }

  async function submitCatalog(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      await api<CatalogItem>("/api/catalogo", {
        method: "POST",
        body: JSON.stringify({
          nombre: form.get("nombre"),
          tipo: form.get("tipo"),
          categoria: form.get("categoria"),
          unidad: "kg",
          activo: true,
        }),
      });
      formElement.reset();
      setNotice("Producto agregado al catálogo.");
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo guardar el producto.");
    }
  }

  async function submitProvider(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      await api<Provider>("/api/proveedores", {
        method: "POST",
        body: JSON.stringify({
          razon_social: form.get("razon_social"),
          tipo: form.get("tipo"),
          activo: true,
        }),
      });
      formElement.reset();
      setNotice("Proveedor agregado.");
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo guardar el proveedor.");
    }
  }

  async function submitDesposte(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    try {
      await api<Processing[]>("/api/despostes", {
        method: "POST",
        body: JSON.stringify({
          ingreso_id: Number(form.get("ingreso_id")),
          items: [{ catalogo_id: Number(form.get("catalogo_id")), peso_kg: Number(form.get("peso_kg")) }],
          observaciones: form.get("observaciones") || null,
        }),
      });
      formElement.reset();
      setNotice("Desposte registrado; se actualizaron cámara y stock de cortes.");
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo registrar el desposte.");
    }
  }

  async function submitStockAdjustment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const catalogoId = Number(form.get("catalogo_id"));
    try {
      await api(`/api/saldos/${catalogoId}`, {
        method: "PUT",
        body: JSON.stringify({
          saldo_fisico_kg: Number(form.get("saldo_fisico_kg")),
          motivo: form.get("motivo"),
        }),
      });
      formElement.reset();
      setNotice("Conteo físico guardado en el historial de ajustes.");
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo ajustar el saldo.");
    }
  }

  const mediaRes = catalog.filter((item) => item.tipo === "MEDIA_RES");
  const outputs = catalog.filter((item) => item.tipo !== "MEDIA_RES");
  const openIntakes = intakes.filter((item) => item.estado !== "DESPOSTADA");
  const catalogName = (id: number) => catalog.find((item) => item.id === id)?.nombre ?? `Producto ${id}`;
  const providerName = (id: number) =>
    providers.find((provider) => provider.id === id)?.razon_social ?? `Proveedor ${id}`;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" onClick={() => setView("resumen")}>
          <span className="brand-mark">A</span>
          <span><strong>ALANTIA</strong><small>OPERACIÓN FRIGORÍFICA</small></span>
        </a>
        <div className="side-label">GESTIÓN</div>
        <nav>
          {(Object.keys(viewLabels) as View[]).map((key) => (
            <button
              className={`nav-item ${view === key ? "active" : ""}`}
              key={key}
              onClick={() => { setView(key); setNotice(""); }}
            >
              <span className="nav-dot" />{viewLabels[key]}
            </button>
          ))}
        </nav>
        <div className="sidebar-foot">
          <span className="status-dot" /> API local · 127.0.0.1:8008
          <small>Base SQLite aislada · 0.1.0</small>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div><span className="eyebrow">MÓDULO AUTÓNOMO</span><h1>{viewLabels[view]}</h1></div>
          <button className="refresh" onClick={() => void refresh()} disabled={loading}>
            {loading ? "Actualizando..." : "↻ Actualizar"}
          </button>
        </header>
        <div className="content">
          {error && <div className="alert error" role="alert">{error}</div>}
          {notice && <div className="alert success" role="status">{notice}</div>}
          {loading && !report ? <div className="empty">Conectando con la API local...</div> : null}

          {view === "resumen" && report && (
            <>
              <div className="intro">
                <div><h2>Estado operativo</h2><p>Indicadores calculados desde los movimientos registrados en este módulo.</p></div>
                <span className="local-badge"><span className="status-dot" /> Persistencia local</span>
              </div>
              <section className="metrics">
                <Metric label="Stock total" value={`${number(report.stock_total_kg)} kg`} note="Saldo activo" />
                <Metric label="Ingresos" value={number(report.ingresos_registrados)} note={`${number(report.kg_ingresados)} kg recibidos`} />
                <Metric label="Desposte" value={`${number(report.kg_despostados)} kg`} note="Peso procesado" />
                <Metric label="Productos activos" value={number(report.productos_activos)} note="Catálogo disponible" />
              </section>
              <Panel title="Stock por producto" action={() => setView("stock")}>
                <StockTable rows={report.stock_por_producto} />
              </Panel>
            </>
          )}

          {view === "stock" && (
            <>
              <Panel title="Existencias actuales" subtitle="Saldos en kilogramos. Los movimientos de ingreso y desposte actualizan el stock.">
                <StockTable rows={stock} />
              </Panel>
              <Panel title="Registrar conteo físico" subtitle="El saldo ajustado y el motivo quedan guardados en el historial.">
                <form className="form-grid" onSubmit={submitStockAdjustment}>
                  <label>Producto<select name="catalogo_id" required defaultValue=""><option value="" disabled>Seleccionar</option>{catalog.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select></label>
                  <label>Saldo contado (kg)<input name="saldo_fisico_kg" type="number" min="0" step="0.001" required /></label>
                  <label className="wide">Motivo<input name="motivo" minLength={3} maxLength={240} required /></label>
                  <button className="primary wide" type="submit" disabled={!catalog.length}>Guardar ajuste auditado</button>
                </form>
              </Panel>
            </>
          )}

          {view === "ingresos" && (
            <div className="columns">
              <Panel title="Registrar media res" subtitle="Cada ingreso queda identificado por tropa, garrón y lateralidad.">
                <form className="form-grid" onSubmit={submitIntake}>
                  <label>Proveedor<select name="proveedor_id" required defaultValue=""><option value="" disabled>Seleccionar</option>{providers.map((item) => <option key={item.id} value={item.id}>{item.razon_social}</option>)}</select></label>
                  <label>Producto<select name="catalogo_id" required defaultValue=""><option value="" disabled>Seleccionar</option>{mediaRes.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select></label>
                  <label>Fecha de faena<input name="fecha_faena" type="date" required /></label>
                  <label>Peso (kg)<input name="peso_kg" type="number" min="0.001" step="0.001" required /></label>
                  <label>Número de tropa<input name="numero_tropa" maxLength={40} required /></label>
                  <label>Número de garrón<input name="numero_garron" maxLength={40} required /></label>
                  <label>Lateralidad<select name="lateralidad"><option value="I">Izquierda</option><option value="D">Derecha</option></select></label>
                  <label className="wide">Observaciones<input name="observaciones" maxLength={1000} /></label>
                  <button className="primary wide" type="submit" disabled={!providers.length || !mediaRes.length}>Guardar ingreso</button>
                  {(!providers.length || !mediaRes.length) && <p className="form-help wide">Primero cargá un proveedor y un producto tipo media res en Catálogo y proveedores.</p>}
                </form>
              </Panel>
              <Panel title="Ingresos recientes">
                <IntakeTable rows={intakes.slice(0, 8)} catalogName={catalogName} providerName={providerName} />
              </Panel>
            </div>
          )}

          {view === "trazabilidad" && (
            <>
              <Panel title="Registrar desposte parcial" subtitle="La API valida el peso disponible y mantiene la trazabilidad hasta el ingreso de origen.">
                <form className="form-grid" onSubmit={submitDesposte}>
                  <label>Media res<select name="ingreso_id" required defaultValue=""><option value="" disabled>Seleccionar ingreso</option>{openIntakes.map((item) => <option key={item.id} value={item.id}>{item.numero_tropa} / {item.numero_garron} · {number(item.peso_restante_kg)} kg</option>)}</select></label>
                  <label>Producto obtenido<select name="catalogo_id" required defaultValue=""><option value="" disabled>Seleccionar corte</option>{outputs.map((item) => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select></label>
                  <label>Peso obtenido (kg)<input name="peso_kg" type="number" min="0.001" step="0.001" required /></label>
                  <label>Observaciones<input name="observaciones" maxLength={1000} /></label>
                  <button className="primary wide" type="submit" disabled={!openIntakes.length || !outputs.length}>Registrar desposte</button>
                </form>
              </Panel>
              <Panel title="Trazabilidad de medias res" subtitle="Seguimiento por tropa y garrón, desde la cámara hasta el producto obtenido.">
                <IntakeTable rows={intakes} catalogName={catalogName} providerName={providerName} />
              </Panel>
              <Panel title="Detalle de despostes">
                {processing.length ? (
                  <div className="table-wrap"><table><thead><tr><th>Operación</th><th>Ingreso</th><th>Producto</th><th>Peso</th><th>Fecha</th></tr></thead>
                    <tbody>{processing.map((row) => <tr key={row.id}><td className="mono">{row.operacion_id.slice(0, 8)}</td><td>#{row.ingreso_id}</td><td>{catalogName(row.catalogo_id)}</td><td>{number(row.peso_kg)} kg</td><td>{new Date(row.creado_en).toLocaleString("es-AR")}</td></tr>)}</tbody>
                  </table></div>
                ) : <div className="empty">Todavía no hay despostes registrados.</div>}
              </Panel>
            </>
          )}

          {view === "maestros" && (
            <div className="columns">
              <Panel title="Nuevo producto">
                <form className="form-grid" onSubmit={submitCatalog}>
                  <label className="wide">Nombre<input name="nombre" minLength={2} maxLength={120} required /></label>
                  <label>Tipo<select name="tipo"><option value="MEDIA_RES">Media res</option><option value="CORTE">Corte</option><option value="ELABORADO">Elaborado</option><option value="SUBPRODUCTO">Subproducto</option><option value="AVE">Ave</option></select></label>
                  <label>Categoría<input name="categoria" defaultValue="Vacuno" maxLength={80} required /></label>
                  <button className="primary wide" type="submit">Agregar producto</button>
                </form>
                <div className="master-list">{catalog.map((item) => <div key={item.id}><span>{item.nombre}<small>{item.categoria}</small></span><span className="tag">{item.tipo.replace("_", " ")}</span></div>)}</div>
              </Panel>
              <Panel title="Nuevo proveedor">
                <form className="form-grid" onSubmit={submitProvider}>
                  <label className="wide">Razón social<input name="razon_social" minLength={2} maxLength={160} required /></label>
                  <label className="wide">Tipo<select name="tipo"><option value="FRIGORIFICO">Frigorífico</option><option value="AVICOLA">Avícola</option><option value="OTRO">Otro</option></select></label>
                  <button className="primary wide" type="submit">Agregar proveedor</button>
                </form>
                <div className="master-list">{providers.map((item) => <div key={item.id}><span>{item.razon_social}<small>{item.tipo}</small></span><span className="status-dot" /></div>)}</div>
              </Panel>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return <article className="metric"><span>{label}</span><strong>{value}</strong><small>{note}</small></article>;
}

function Panel({ title, subtitle, action, children }: { title: string; subtitle?: string; action?: () => void; children: React.ReactNode }) {
  return <section className="panel"><div className="panel-head"><div><h3>{title}</h3>{subtitle && <p>{subtitle}</p>}</div>{action && <button className="text-button" onClick={action}>Ver stock →</button>}</div>{children}</section>;
}

function StockTable({ rows }: { rows: Stock[] }) {
  return rows.length ? <div className="table-wrap"><table><thead><tr><th>Producto</th><th>Tipo</th><th>Saldo</th><th>Actualización</th></tr></thead>
    <tbody>{rows.map((row) => <tr key={row.catalogo_id}><td><strong>{row.producto}</strong></td><td><span className="tag">{row.tipo.replace("_", " ")}</span></td><td>{number(row.cantidad_kg)} kg</td><td>{new Date(row.actualizado_en).toLocaleString("es-AR")}</td></tr>)}</tbody>
  </table></div> : <div className="empty">No hay saldos para mostrar. Registrá un ingreso para comenzar.</div>;
}

function IntakeTable({ rows, catalogName, providerName }: { rows: Intake[]; catalogName: (id: number) => string; providerName: (id: number) => string }) {
  return rows.length ? <div className="table-wrap"><table><thead><tr><th>Tropa / garrón</th><th>Proveedor</th><th>Media res</th><th>Peso restante</th><th>Estado</th></tr></thead>
    <tbody>{rows.map((row) => <tr key={row.id}><td><strong>{row.numero_tropa} / {row.numero_garron}</strong><small className="cell-sub">Lateral {row.lateralidad}</small></td><td>{providerName(row.proveedor_id)}</td><td>{catalogName(row.catalogo_id)}</td><td>{number(row.peso_restante_kg)} kg</td><td><span className={`state ${row.estado.toLowerCase()}`}>{row.estado}</span></td></tr>)}</tbody>
  </table></div> : <div className="empty">No hay ingresos registrados.</div>;
}

export default App;

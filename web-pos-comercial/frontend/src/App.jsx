import { useCallback, useEffect, useMemo, useState } from "react";

const API_URL = import.meta.env.VITE_POS_API_URL || "http://127.0.0.1:8007";
const PAYMENT_METHODS = [
  { key: "EFECTIVO", label: "Efectivo", note: "Calcula vuelto" },
  { key: "TARJETA_SIMULADA", label: "Tarjeta", note: "Simulada" },
  { key: "QR_SIMULADO", label: "QR", note: "Simulado" },
];
const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 2,
});
const amount = (value) => Number(value || 0);

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...options.headers },
    });
  } catch {
    throw new Error("No se pudo conectar con la API local. Verificá que esté activa en el puerto 8007.");
  }
  const body = response.status === 204 ? null : await response.json();
  if (!response.ok) {
    throw new Error(body?.detail || "La operación no pudo completarse.");
  }
  return body;
}

function App() {
  const [products, setProducts] = useState([]);
  const [productSearch, setProductSearch] = useState("");
  const [register, setRegister] = useState(null);
  const [report, setReport] = useState(null);
  const [ticket, setTicket] = useState(null);
  const [cart, setCart] = useState({});
  const [screenError, setScreenError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState("");
  const [openingAmount, setOpeningAmount] = useState("0");
  const [closingAmount, setClosingAmount] = useState("");
  const [payments, setPayments] = useState({ EFECTIVO: "", TARJETA_SIMULADA: "", QR_SIMULADO: "" });
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setScreenError("");
    try {
      const [catalog, currentRegister] = await Promise.all([
        request("/api/productos"),
        request("/api/caja/actual"),
      ]);
      setProducts(catalog);
      setRegister(currentRegister);
      if (currentRegister) {
        setReport(await request("/api/caja/actual/reporte"));
      } else {
        setReport(null);
      }
    } catch (error) {
      setScreenError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const cartItems = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, quantity]) => {
          const product = products.find((item) => item.id === Number(id));
          return product ? { product, quantity } : null;
        })
        .filter(Boolean),
    [cart, products],
  );
  const filteredProducts = useMemo(() => {
    const query = normalizeSearch(productSearch);
    if (!query) return products;
    return products.filter((product) =>
      [product.codigo, product.nombre, product.categoria]
        .some((value) => normalizeSearch(value).includes(query)),
    );
  }, [productSearch, products]);
  const total = cartItems.reduce((sum, item) => sum + amount(item.product.precio) * item.quantity, 0);
  const nonCash = amount(payments.TARJETA_SIMULADA) + amount(payments.QR_SIMULADO);
  const cashReceived = amount(payments.EFECTIVO);
  const cashDue = Math.max(0, total - nonCash);
  const change = Math.max(0, cashReceived - cashDue);
  const remaining = Math.max(0, total - nonCash - cashReceived);

  function changeQuantity(productId, delta) {
    setCart((current) => {
      const next = { ...current };
      const quantity = (next[productId] || 0) + delta;
      if (quantity <= 0) delete next[productId];
      else next[productId] = quantity;
      return next;
    });
  }

  function handleProductSearchKeyDown(event) {
    if (event.key !== "Enter" || !register || filteredProducts.length === 0) return;
    event.preventDefault();
    changeQuantity(filteredProducts[0].id, 1);
    setProductSearch("");
  }

  function startCheckout() {
    setPayments({ EFECTIVO: total.toFixed(2), TARJETA_SIMULADA: "", QR_SIMULADO: "" });
    setDialog("checkout");
  }

  async function submitOpening(event) {
    event.preventDefault();
    setSaving(true);
    setScreenError("");
    try {
      await request("/api/caja/aperturas", {
        method: "POST",
        body: JSON.stringify({ monto_inicial: openingAmount }),
      });
      setDialog("");
      setNotice("Caja abierta. Ya podés iniciar las ventas.");
      await refresh();
    } catch (error) {
      setScreenError(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function submitSale(event) {
    event.preventDefault();
    if (remaining > 0 || nonCash > total) return;
    const salePayments = PAYMENT_METHODS.map(({ key }) => ({
      medio: key,
      monto: payments[key],
    })).filter((payment) => amount(payment.monto) > 0);
    setSaving(true);
    setScreenError("");
    try {
      const sale = await request("/api/ventas", {
        method: "POST",
        body: JSON.stringify({
          items: cartItems.map(({ product, quantity }) => ({
            producto_id: product.id,
            cantidad: quantity,
          })),
          pagos: salePayments,
        }),
      });
      setCart({});
      setTicket(sale);
      setDialog("ticket");
      setNotice(`Venta #${sale.id} registrada. Vuelto: ${money.format(amount(sale.vuelto))}.`);
      await refresh();
    } catch (error) {
      setScreenError(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function openClosingReport() {
    setScreenError("");
    try {
      const currentReport = await request("/api/caja/actual/reporte");
      setReport(currentReport);
      setClosingAmount(amount(currentReport.efectivo_esperado).toFixed(2));
      setDialog("closing");
    } catch (error) {
      setScreenError(error.message);
    }
  }

  async function submitClosing(event) {
    event.preventDefault();
    setSaving(true);
    setScreenError("");
    try {
      const result = await request("/api/caja/cierre", {
        method: "POST",
        body: JSON.stringify({ monto_cierre_declarado: closingAmount }),
      });
      setDialog("");
      setNotice(`Turno cerrado. Diferencia de caja: ${money.format(amount(result.diferencia))}.`);
      setCart({});
      await refresh();
    } catch (error) {
      setScreenError(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="pos-shell min-h-screen">
      <header className="topbar">
        <a className="brand" href="/" aria-label="POS Comercial inicio">
          <span className="brand-mark">P</span>
          <span><strong>punto</strong><small>POS COMERCIAL</small></span>
        </a>
        <div className="topbar-right">
          <span className="demo-tag">ENTORNO DE DEMOSTRACIÓN</span>
          <div className={`register-state ${register ? "is-open" : ""}`}>
            <i />
            {register ? `Turno #${register.id} abierto` : "Caja cerrada"}
          </div>
          {register ? (
            <button className="button button-outline" onClick={openClosingReport}>Cerrar turno</button>
          ) : (
            <button className="button button-dark" onClick={() => setDialog("opening")}>Abrir caja</button>
          )}
        </div>
      </header>

      <section className="workspace">
        <div className="catalog">
          <div className="page-heading">
            <div>
              <p className="eyebrow">PUNTO DE VENTA <span>•</span> VENTA RÁPIDA</p>
              <h1>Mostrador</h1>
              <p className="subheading">Elegí productos para agregarlos a la venta.</p>
            </div>
            <div className="today-chip"><span className="today-dot" /> Operación local</div>
          </div>

          {screenError && <div className="alert alert-error" role="alert">{screenError}</div>}
          {notice && <div className="alert alert-success" role="status">{notice}<button onClick={() => setNotice("")} aria-label="Cerrar aviso">×</button></div>}

          {!register && !loading && (
            <div className="empty-register">
              <span className="empty-icon">01</span>
              <div><strong>Empezá por abrir la caja</strong><p>El turno debe estar abierto para registrar ventas.</p></div>
              <button className="button button-dark" onClick={() => setDialog("opening")}>Abrir caja</button>
            </div>
          )}

          <div className="catalog-toolbar">
            <div><h2>Productos</h2><span>{loading ? "Cargando…" : `${products.length} disponibles`}</span></div>
            <label className="product-search">
              <span aria-hidden="true">⌕</span>
              <input
                type="search"
                aria-label="Buscar productos por nombre, código o categoría"
                placeholder="Buscar o escanear código"
                value={productSearch}
                onChange={(event) => setProductSearch(event.target.value)}
                onKeyDown={handleProductSearchKeyDown}
              />
              <kbd>Enter</kbd>
            </label>
          </div>
          {loading ? (
            <div className="loading-state">Conectando con el punto de venta…</div>
          ) : products.length === 0 ? (
            <div className="loading-state">No hay productos activos en el catálogo.</div>
          ) : filteredProducts.length === 0 ? (
            <div className="loading-state">No encontramos productos para esa búsqueda.</div>
          ) : (
            <div className="product-grid">
              {filteredProducts.map((product, index) => (
                <button
                  className={`product-card tone-${index % 5}`}
                  key={product.id}
                  onClick={() => changeQuantity(product.id, 1)}
                  disabled={!register}
                >
                  <span className="product-category">{product.categoria}</span>
                  <span className="product-art" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                  <strong>{product.nombre}</strong>
                  <span className="product-bottom"><b>{money.format(amount(product.precio))}</b><i>+</i></span>
                </button>
              ))}
            </div>
          )}
          <p className="catalog-disclaimer">Catálogo ficticio de demostración. Los medios electrónicos no procesan pagos reales.</p>
        </div>

        <aside className="cart-panel">
          <div className="cart-heading">
            <div><p className="eyebrow">VENTA ACTUAL</p><h2>Carrito <span>{cartItems.reduce((sum, item) => sum + item.quantity, 0)}</span></h2></div>
            {cartItems.length > 0 && <button className="text-button" onClick={() => setCart({})}>Vaciar</button>}
          </div>
          {cartItems.length === 0 ? (
            <div className="cart-empty">
              <div className="cart-empty-mark">+</div>
              <strong>Tu venta empieza acá</strong>
              <p>Seleccioná productos de la grilla para agregarlos al carrito.</p>
            </div>
          ) : (
            <div className="cart-lines">
              {cartItems.map(({ product, quantity }) => (
                <div className="cart-line" key={product.id}>
                  <div className="cart-line-copy">
                    <strong>{product.nombre}</strong>
                    <span>{money.format(amount(product.precio))} c/u</span>
                  </div>
                  <div className="quantity-control">
                    <button onClick={() => changeQuantity(product.id, -1)} aria-label={`Quitar una unidad de ${product.nombre}`}>−</button>
                    <span>{quantity}</span>
                    <button onClick={() => changeQuantity(product.id, 1)} aria-label={`Agregar una unidad de ${product.nombre}`}>+</button>
                  </div>
                  <b className="line-total">{money.format(amount(product.precio) * quantity)}</b>
                </div>
              ))}
            </div>
          )}
          <div className="cart-summary">
            <div className="summary-row"><span>Subtotal</span><span>{money.format(total)}</span></div>
            <div className="summary-row total-row"><strong>Total</strong><strong>{money.format(total)}</strong></div>
            <button className="button button-pay" disabled={!register || total <= 0} onClick={startCheckout}>
              Cobrar venta <span>→</span>
            </button>
            <p className="secure-note"><span>●</span> Venta guardada en la base local del POS</p>
          </div>
        </aside>
      </section>

      {dialog === "opening" && (
        <Modal title="Abrir caja" eyebrow="INICIO DE TURNO" onClose={() => setDialog("")}>
          <form onSubmit={submitOpening}>
            <p className="modal-description">Registrá el efectivo inicial disponible en el cajón.</p>
            <label className="field-label" htmlFor="opening">Fondo inicial</label>
            <MoneyInput id="opening" value={openingAmount} onChange={setOpeningAmount} />
            <p className="field-help">Este importe se incluye en el efectivo esperado al cierre.</p>
            {screenError && <div className="inline-error">{screenError}</div>}
            <div className="modal-actions">
              <button type="button" className="button button-outline" onClick={() => setDialog("")}>Cancelar</button>
              <button className="button button-dark" disabled={saving}>{saving ? "Abriendo…" : "Abrir turno"}</button>
            </div>
          </form>
        </Modal>
      )}

      {dialog === "checkout" && (
        <Modal title="Cobrar venta" eyebrow="CONFIRMAR PAGO" onClose={() => setDialog("")}>
          <form onSubmit={submitSale}>
            <div className="checkout-total"><span>Total a cobrar</span><strong>{money.format(total)}</strong></div>
            <p className="modal-description">Podés combinar medios. Tarjeta y QR son simulaciones locales.</p>
            <div className="payment-fields">
              {PAYMENT_METHODS.map((method) => (
                <label className="payment-field" key={method.key}>
                  <span><strong>{method.label}</strong><small>{method.note}</small></span>
                  <MoneyInput
                    aria-label={`${method.label}: ${method.key === "EFECTIVO" ? "efectivo recibido" : "importe a aplicar"}`}
                    value={payments[method.key]}
                    onChange={(value) => setPayments((current) => ({ ...current, [method.key]: value }))}
                    compact
                  />
                </label>
              ))}
            </div>
            <div className="payment-result">
              <span>{remaining > 0 ? "Falta recibir" : nonCash > total ? "Excede el total" : "Vuelto en efectivo"}</span>
              <strong className={remaining > 0 || nonCash > total ? "text-danger" : ""}>
                {money.format(remaining > 0 ? remaining : nonCash > total ? nonCash - total : change)}
              </strong>
            </div>
            {screenError && <div className="inline-error">{screenError}</div>}
            <div className="modal-actions">
              <button type="button" className="button button-outline" onClick={() => setDialog("")}>Volver</button>
              <button className="button button-dark" disabled={saving || remaining > 0 || nonCash > total}>
                {saving ? "Registrando…" : "Confirmar venta"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {dialog === "closing" && report && (
        <Modal title="Cierre de turno" eyebrow={`RESUMEN DE CAJA · TURNO #${register?.id}`} onClose={() => setDialog("")}>
          <form onSubmit={submitClosing}>
            <div className="report-grid">
              <ReportItem label="Ventas del turno" value={money.format(amount(report.ventas_total))} strong />
              <ReportItem label="Operaciones" value={report.ventas_cantidad} />
              <ReportItem label="Efectivo aplicado" value={money.format(amount(report.efectivo_aplicado))} />
              <ReportItem label="Tarjeta simulada" value={money.format(amount(report.tarjeta_simulada))} />
              <ReportItem label="QR simulado" value={money.format(amount(report.qr_simulado))} />
              <ReportItem label="Fondo inicial" value={money.format(amount(report.monto_inicial))} />
            </div>
            <div className="expected-cash"><span>Efectivo esperado en caja</span><strong>{money.format(amount(report.efectivo_esperado))}</strong></div>
            <label className="field-label" htmlFor="closing">Efectivo contado</label>
            <MoneyInput id="closing" value={closingAmount} onChange={setClosingAmount} />
            <p className="field-help">La diferencia se calcula al confirmar el cierre.</p>
            {screenError && <div className="inline-error">{screenError}</div>}
            <div className="modal-actions">
              <button type="button" className="button button-outline" onClick={() => setDialog("")}>Volver a la venta</button>
              <button className="button button-dark" disabled={saving}>{saving ? "Cerrando…" : "Confirmar cierre"}</button>
            </div>
          </form>
        </Modal>
      )}

      {dialog === "ticket" && ticket && (
        <Modal title="Comprobante de venta" eyebrow="VENTA REGISTRADA" onClose={() => setDialog("")}>
          <article className="ticket-paper">
            <header className="ticket-header">
              <strong>punto</strong>
              <span>COMPROBANTE NO FISCAL</span>
            </header>
            <div className="ticket-meta">
              <span>Venta #{ticket.id}</span>
              <span>{new Date(ticket.fecha).toLocaleString("es-AR")}</span>
              <span>Turno #{ticket.caja_id}</span>
            </div>
            <div className="ticket-lines">
              {ticket.detalles.map((item) => (
                <div className="ticket-line" key={item.id}>
                  <span>{item.cantidad} × {item.nombre_producto}</span>
                  <strong>{money.format(amount(item.subtotal))}</strong>
                </div>
              ))}
            </div>
            <div className="ticket-total">
              <span>TOTAL</span>
              <strong>{money.format(amount(ticket.total))}</strong>
            </div>
            <div className="ticket-payments">
              {ticket.medios_pago.map((payment) => (
                <div className="ticket-line" key={payment.id}>
                  <span>{paymentLabel(payment.medio)}</span>
                  <strong>{money.format(amount(payment.monto))}</strong>
                </div>
              ))}
            </div>
            <div className="ticket-line ticket-change">
              <span>Vuelto</span>
              <strong>{money.format(amount(ticket.vuelto))}</strong>
            </div>
            <footer>Gracias por tu compra</footer>
          </article>
          <div className="modal-actions ticket-actions">
            <button type="button" className="button button-outline" onClick={() => setDialog("")}>Cerrar</button>
            <button type="button" className="button button-dark" onClick={() => window.print()}>
              Imprimir / Guardar PDF
            </button>
          </div>
        </Modal>
      )}
    </main>
  );
}

function normalizeSearch(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-AR")
    .trim();
}

function paymentLabel(method) {
  return PAYMENT_METHODS.find(({ key }) => key === method)?.label ?? method;
}

function MoneyInput({ value, onChange, id, compact = false, ...props }) {
  return (
    <span className={`money-input ${compact ? "money-input-compact" : ""}`}>
      <span>$</span>
      <input
        id={id}
        type="number"
        min="0"
        step="0.01"
        inputMode="decimal"
        required={!compact}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        {...props}
      />
    </span>
  );
}

function Modal({ title, eyebrow, onClose, children }) {
  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal-card" role="dialog" aria-modal="true" aria-label={title}>
        <button className="modal-close" onClick={onClose} aria-label="Cerrar">×</button>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        {children}
      </section>
    </div>
  );
}

function ReportItem({ label, value, strong = false }) {
  return <div className={`report-item ${strong ? "report-item-strong" : ""}`}><span>{label}</span><strong>{value}</strong></div>;
}

export default App;

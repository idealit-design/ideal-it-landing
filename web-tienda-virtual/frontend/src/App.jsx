import { useEffect, useMemo, useState } from "react";

import { api } from "./api.js";

const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 2,
});

const categoryArtwork = {
  hogar: "art-hogar",
  tecnologia: "art-tecnologia",
  accesorios: "art-accesorios",
};

function getCartId() {
  const savedId = window.localStorage.getItem("tienda-virtual-cart-id");
  if (savedId) return savedId;
  const cartId = window.crypto.randomUUID();
  window.localStorage.setItem("tienda-virtual-cart-id", cartId);
  return cartId;
}

function Mark({ children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full bg-[#f0ede4] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#555b4d] ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-clay" aria-hidden="true" />
      {children}
    </span>
  );
}

function ProductArtwork({ category, className = "" }) {
  return (
    <div
      className={`product-art ${categoryArtwork[category?.slug] ?? "art-hogar"} ${className}`}
      aria-hidden="true"
    >
      <span className="art-glow" />
      <span className="art-object" />
      <span className="art-shadow" />
      <span className="art-spark art-spark-one">✳</span>
      <span className="art-spark art-spark-two">·</span>
    </div>
  );
}

function Header({ cartCount, onCart, onHome }) {
  return (
    <header className="border-b border-line bg-paper">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <button className="flex items-center gap-3 text-left" onClick={onHome} aria-label="Ir al catálogo">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-moss text-lg text-white">
            c.
          </span>
          <span>
            <span className="block font-display text-xl leading-none tracking-tight text-ink">
              casa nativa
            </span>
            <span className="mt-1 block text-[9px] uppercase tracking-[0.28em] text-[#777a71]">
              objetos con intención
            </span>
          </span>
        </button>
        <nav className="flex items-center gap-5 sm:gap-9" aria-label="Navegación principal">
          <button
            className="hidden text-sm font-medium text-ink transition hover:text-moss sm:block"
            onClick={onHome}
          >
            Tienda
          </button>
          <span className="hidden text-sm text-[#777a71] sm:block">Colección 2026</span>
          <button
            className="relative flex h-11 w-11 items-center justify-center rounded-full border border-line text-ink transition hover:border-moss"
            onClick={onCart}
            aria-label={`Abrir carrito${cartCount ? `, ${cartCount} productos` : ""}`}
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
              <path
                d="M4 5h2l2.2 10.1a2 2 0 0 0 2 1.6h6.9a2 2 0 0 0 2-1.6L21 8H7"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="10" cy="20" r="1" fill="currentColor" />
              <circle cx="18" cy="20" r="1" fill="currentColor" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-clay px-1 text-[10px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </button>
        </nav>
      </div>
    </header>
  );
}

function ProductCard({ product, onOpen, onAdd }) {
  return (
    <article className="group min-w-0">
      <button className="block w-full text-left" onClick={() => onOpen(product)} aria-label={`Ver ${product.nombre}`}>
        <div className="relative overflow-hidden rounded-[1.35rem] bg-[#ece9df]">
          <ProductArtwork category={product.categoria} className="aspect-[4/4.4] transition duration-500 group-hover:scale-[1.025]" />
          <span className="absolute left-4 top-4 rounded-full bg-white/80 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#4d554c] backdrop-blur">
            {product.categoria.nombre}
          </span>
          {product.stock <= 3 && (
            <span className="absolute bottom-4 left-4 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-medium text-ink">
              Quedan {product.stock}
            </span>
          )}
        </div>
        <div className="flex items-start justify-between gap-3 pt-4">
          <div>
            <h2 className="font-display text-xl text-ink transition group-hover:text-moss">
              {product.nombre}
            </h2>
            <p className="mt-1 line-clamp-2 text-sm leading-6 text-[#777a71]">
              {product.descripcion}
            </p>
          </div>
          <span className="whitespace-nowrap pt-1 text-sm font-semibold text-ink">
            {money.format(product.precio)}
          </span>
        </div>
      </button>
      <button
        className="mt-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-moss transition hover:text-clay disabled:cursor-not-allowed disabled:text-[#a7a89f]"
        onClick={() => onAdd(product)}
        disabled={product.stock === 0}
      >
        {product.stock > 0 ? "Agregar al carrito" : "Sin stock"}
        <span aria-hidden="true">↗</span>
      </button>
    </article>
  );
}

function Storefront({ categories, products, selectedCategory, onSelectCategory, onOpenProduct, onAdd }) {
  const [search, setSearch] = useState("");
  const filteredProducts = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("es");
    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === "all" || product.categoria_id === Number(selectedCategory);
      const matchesSearch =
        !query ||
        `${product.nombre} ${product.descripcion} ${product.categoria.nombre}`
          .toLocaleLowerCase("es")
          .includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [products, search, selectedCategory]);

  return (
    <>
      <section className="mx-auto max-w-7xl px-5 pb-12 pt-10 sm:px-8 sm:pb-16 sm:pt-14 lg:px-12 lg:pt-20">
        <div className="grid items-end gap-8 md:grid-cols-[1fr_auto]">
          <div className="max-w-3xl">
            <Mark>Una tienda para descubrir</Mark>
            <h1 className="mt-6 font-display text-5xl leading-[1.04] tracking-[-0.045em] text-ink sm:text-6xl lg:text-7xl">
              Pequeños objetos,
              <br />
              <span className="italic text-moss">grandes rituales.</span>
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-[#777a71]">
              Una selección de piezas honestas, hechas para acompañar tus días y quedarse en casa.
            </p>
          </div>
          <label className="relative block w-full md:w-72">
            <span className="sr-only">Buscar productos</span>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#777a71]"
              aria-hidden="true"
            >
              <circle cx="10.8" cy="10.8" r="6.8" stroke="currentColor" strokeWidth="1.5" />
              <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              className="w-full rounded-full border border-line bg-white py-3.5 pl-11 pr-4 text-sm outline-none transition placeholder:text-[#9a9b94] focus:border-moss"
              placeholder="Buscar una pieza..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-20 sm:px-8 lg:px-12" aria-label="Catálogo">
        <div className="flex flex-col gap-5 border-y border-line py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2" aria-label="Filtrar por categoría">
            <button
              onClick={() => onSelectCategory("all")}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                selectedCategory === "all" ? "bg-ink text-white" : "bg-white text-[#686b63] hover:bg-[#efede6]"
              }`}
            >
              Todo
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => onSelectCategory(String(category.id))}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                  selectedCategory === String(category.id)
                    ? "bg-ink text-white"
                    : "bg-white text-[#686b63] hover:bg-[#efede6]"
                }`}
              >
                {category.nombre}
              </button>
            ))}
          </div>
          <span className="text-xs text-[#8b8d85]">
            {filteredProducts.length} {filteredProducts.length === 1 ? "pieza" : "piezas"}
          </span>
        </div>

        {filteredProducts.length ? (
          <div className="grid grid-cols-1 gap-x-6 gap-y-11 pt-8 sm:grid-cols-2 sm:gap-y-14 lg:grid-cols-3 lg:gap-x-8">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onOpen={onOpenProduct}
                onAdd={onAdd}
              />
            ))}
          </div>
        ) : (
          <div className="py-24 text-center">
            <p className="font-display text-2xl text-ink">No encontramos esa pieza.</p>
            <p className="mt-2 text-sm text-[#777a71]">Prueba con otro nombre o cambia la categoría.</p>
          </div>
        )}
      </section>
    </>
  );
}

function ProductDetail({ product, onBack, onAdd }) {
  return (
    <main className="mx-auto grid max-w-6xl gap-10 px-5 py-10 sm:px-8 sm:py-16 md:grid-cols-2 md:items-center lg:px-12">
      <ProductArtwork category={product.categoria} className="aspect-square rounded-[2rem]" />
      <section>
        <button
          className="mb-8 text-xs font-semibold uppercase tracking-[0.12em] text-moss hover:text-clay"
          onClick={onBack}
        >
          ← Volver a la tienda
        </button>
        <Mark>{product.categoria.nombre}</Mark>
        <h1 className="mt-5 font-display text-5xl tracking-tight text-ink">{product.nombre}</h1>
        <p className="mt-4 text-2xl font-medium text-ink">{money.format(product.precio)}</p>
        <p className="mt-6 max-w-lg text-base leading-8 text-[#777a71]">{product.descripcion}</p>
        <p className="mt-5 text-xs text-[#777a71]">
          {product.stock > 0 ? `${product.stock} disponibles` : "Sin stock"}
        </p>
        <button
          className="mt-8 rounded-full bg-moss px-7 py-4 text-sm font-semibold text-white transition hover:bg-[#354e3b] disabled:cursor-not-allowed disabled:bg-[#92988f]"
          onClick={() => onAdd(product)}
          disabled={product.stock === 0}
        >
          {product.stock > 0 ? "Agregar al carrito" : "Sin stock"}
        </button>
      </section>
    </main>
  );
}

function CartPage({ cart, onBack, onQuantity, onRemove, onCheckout, busy }) {
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");

  return (
    <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14 lg:px-12">
      <button
        className="mb-8 text-xs font-semibold uppercase tracking-[0.12em] text-moss hover:text-clay"
        onClick={onBack}
      >
        ← Seguir explorando
      </button>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Mark>Tu selección</Mark>
          <h1 className="mt-4 font-display text-5xl tracking-tight text-ink">El carrito.</h1>
        </div>
        <span className="pb-2 text-sm text-[#777a71]">
          {cart.items.length} {cart.items.length === 1 ? "producto" : "productos"}
        </span>
      </div>

      {cart.items.length === 0 ? (
        <div className="mt-10 rounded-[1.5rem] border border-line bg-white px-6 py-16 text-center">
          <p className="font-display text-2xl text-ink">Todavía no hay piezas por aquí.</p>
          <p className="mt-2 text-sm text-[#777a71]">Encuentra algo especial para tu espacio.</p>
          <button
            onClick={onBack}
            className="mt-6 rounded-full bg-moss px-6 py-3 text-sm font-semibold text-white hover:bg-[#354e3b]"
          >
            Volver a la tienda
          </button>
        </div>
      ) : (
        <div className="mt-9 grid gap-10 lg:grid-cols-[1fr_21rem]">
          <div className="divide-y divide-line border-y border-line">
            {cart.items.map(({ producto, cantidad, subtotal }) => (
              <article key={producto.id} className="flex gap-4 py-5 sm:gap-6">
                <ProductArtwork
                  category={producto.categoria}
                  className="h-28 w-24 shrink-0 rounded-2xl sm:h-36 sm:w-32"
                />
                <div className="flex min-w-0 flex-1 flex-col justify-between py-1 sm:flex-row sm:items-center">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8b8d85]">
                      {producto.categoria.nombre}
                    </p>
                    <h2 className="mt-1 font-display text-lg text-ink">{producto.nombre}</h2>
                    <p className="mt-1 text-sm text-[#777a71]">{money.format(producto.precio)}</p>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-5 sm:mt-0">
                    <div className="flex items-center rounded-full border border-line">
                      <button
                        className="h-9 w-9 text-sm text-ink disabled:text-[#b6b7b0]"
                        onClick={() =>
                          cantidad === 1 ? onRemove(producto.id) : onQuantity(producto.id, cantidad - 1)
                        }
                        aria-label={`Quitar una unidad de ${producto.nombre}`}
                      >
                        −
                      </button>
                      <span className="w-5 text-center text-xs font-medium">{cantidad}</span>
                      <button
                        className="h-9 w-9 text-sm text-ink disabled:text-[#b6b7b0]"
                        onClick={() => onQuantity(producto.id, cantidad + 1)}
                        disabled={cantidad >= producto.stock}
                        aria-label={`Agregar una unidad de ${producto.nombre}`}
                      >
                        +
                      </button>
                    </div>
                    <span className="min-w-20 text-right text-sm font-semibold text-ink">
                      {money.format(subtotal)}
                    </span>
                  </div>
                </div>
                <button
                  className="self-start p-1 text-xs text-[#8b8d85] hover:text-clay"
                  onClick={() => onRemove(producto.id)}
                  aria-label={`Eliminar ${producto.nombre}`}
                >
                  ×
                </button>
              </article>
            ))}
          </div>

          <aside className="h-fit rounded-[1.5rem] bg-white p-6 shadow-soft">
            <div className="flex justify-between text-sm text-[#777a71]">
              <span>Subtotal</span>
              <span>{money.format(cart.total)}</span>
            </div>
            <div className="mt-4 flex justify-between border-t border-line pt-4 text-base font-semibold text-ink">
              <span>Total</span>
              <span>{money.format(cart.total)}</span>
            </div>
            <form
              className="mt-6 space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                onCheckout({ cliente_nombre: customerName, cliente_email: customerEmail });
              }}
            >
              <label className="block text-xs font-medium text-ink" htmlFor="customer-name">
                Nombre
              </label>
              <input
                id="customer-name"
                className="w-full rounded-xl border border-line px-3 py-2.5 text-sm outline-none focus:border-moss"
                autoComplete="name"
                required
                minLength={2}
                maxLength={120}
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
              />
              <label className="block text-xs font-medium text-ink" htmlFor="customer-email">
                Email
              </label>
              <input
                id="customer-email"
                type="email"
                className="w-full rounded-xl border border-line px-3 py-2.5 text-sm outline-none focus:border-moss"
                autoComplete="email"
                required
                maxLength={254}
                value={customerEmail}
                onChange={(event) => setCustomerEmail(event.target.value)}
              />
              <div className="rounded-xl bg-[#f7f5ef] p-3 text-xs leading-5 text-[#6a6d64]">
                <strong className="text-ink">Modo demo.</strong> El pago es simulado; no se solicitan
                datos de tarjeta ni se realiza ningún cargo.
              </div>
              <button
                className="w-full rounded-full bg-moss px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#354e3b] disabled:cursor-wait disabled:opacity-60"
                type="submit"
                disabled={busy}
              >
                {busy ? "Confirmando..." : "Confirmar pedido"}
              </button>
            </form>
          </aside>
        </div>
      )}
    </main>
  );
}

function Confirmation({ order, onHome }) {
  return (
    <main className="mx-auto max-w-2xl px-5 py-16 text-center sm:px-8 sm:py-24">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#e6eee6] text-2xl text-moss">
        ✓
      </span>
      <Mark className="mt-6">Pedido de demostración</Mark>
      <h1 className="mt-5 font-display text-5xl tracking-tight text-ink">¡Gracias por tu pedido!</h1>
      <p className="mt-3 text-sm leading-6 text-[#777a71]">
        Tu orden quedó registrada. Esta experiencia no procesa cobros reales.
      </p>
      <section className="mt-9 rounded-[1.5rem] border border-line bg-white p-6 text-left sm:p-8">
        <div className="flex flex-wrap justify-between gap-3 border-b border-line pb-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8b8d85]">
              Número de orden
            </p>
            <p className="mt-1 font-display text-xl text-ink">{order.numero}</p>
          </div>
          <span className="h-fit rounded-full bg-[#f0ede4] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-moss">
            Pago simulado
          </span>
        </div>
        <div className="space-y-3 border-b border-line py-5">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between gap-4 text-sm">
              <span className="text-[#686b63]">
                {item.nombre_producto}                 <span className="text-[#9a9b94]">× {item.cantidad}</span>
              </span>
              <span className="font-medium text-ink">
                {money.format(Number(item.precio_unitario) * item.cantidad)}
              </span>
            </div>
          ))}
        </div>
        <div className="flex justify-between pt-5 text-sm font-semibold text-ink">
          <span>Total</span>
          <span>{money.format(order.total)}</span>
        </div>
        <p className="mt-4 text-xs text-[#777a71]">
          {order.cliente_nombre} · {order.cliente_email}
        </p>
      </section>
      <button
        onClick={onHome}
        className="mt-8 rounded-full bg-moss px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-[#354e3b]"
      >
        Volver a la tienda
      </button>
    </main>
  );
}

export default function App() {
  const [cartId] = useState(getCartId);
  const [store, setStore] = useState({ categories: [], products: [] });
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [view, setView] = useState("store");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const refreshStore = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await api.loadStore(cartId);
      setStore({ categories: result.categorias, products: result.productos });
      setCart(result.carrito);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshStore();
  }, [cartId]);

  const withCartUpdate = async (action) => {
    setBusy(true);
    setError("");
    try {
      setCart(await action());
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const addToCart = async (product) => {
    setBusy(true);
    setError("");
    try {
      setCart(
        await api.addCartItem(cartId, {
          producto_id: product.id,
          cantidad: 1,
        }),
      );
      setSelectedProduct(null);
      setView("cart");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const checkout = async (customer) => {
    setBusy(true);
    setError("");
    try {
      const confirmedOrder = await api.checkout(cartId, customer);
      setOrder(confirmedOrder);
      setCart({ items: [], total: 0 });
      setView("confirmation");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const cartCount = cart.items.reduce((sum, item) => sum + item.cantidad, 0);
  const goHome = () => {
    setSelectedProduct(null);
    setView("store");
    setError("");
  };

  return (
    <div className="min-h-screen bg-paper text-ink">
      <div className="flex items-center justify-center gap-2 bg-ink px-4 py-2 text-center text-[10px] font-medium uppercase tracking-[0.12em] text-white sm:text-[11px]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#d49a71]" aria-hidden="true" />
        Experiencia local de demostración · los pagos no son reales
      </div>
      <Header cartCount={cartCount} onCart={() => setView("cart")} onHome={goHome} />

      {error && (
        <div
          className="mx-auto mt-5 flex max-w-7xl items-start justify-between gap-4 px-5 sm:px-8 lg:px-12"
          role="alert"
        >
          <p className="rounded-xl border border-[#e6c6b8] bg-[#fbf0eb] px-4 py-3 text-sm text-[#854d37]">
            {error}
          </p>
          <button
            className="shrink-0 rounded-full border border-line px-4 py-2 text-xs font-semibold text-ink hover:bg-white"
            onClick={refreshStore}
            disabled={loading}
          >
            Reintentar
          </button>
        </div>
      )}

      {loading ? (
        <main className="mx-auto flex max-w-7xl items-center justify-center px-5 py-32 text-sm text-[#777a71]">
          Conectando con la tienda local...
        </main>
      ) : view === "product" && selectedProduct ? (
        <ProductDetail product={selectedProduct} onBack={goHome} onAdd={addToCart} />
      ) : view === "cart" ? (
        <CartPage
          cart={cart}
          onBack={goHome}
          onQuantity={(productId, cantidad) =>
            withCartUpdate(() => api.updateCartItem(cartId, productId, cantidad))
          }
          onRemove={(productId) =>
            withCartUpdate(() => api.removeCartItem(cartId, productId))
          }
          onCheckout={checkout}
          busy={busy}
        />
      ) : view === "confirmation" && order ? (
        <Confirmation order={order} onHome={goHome} />
      ) : (
        <Storefront
          categories={store.categories}
          products={store.products}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          onOpenProduct={(product) => {
            setSelectedProduct(product);
            setView("product");
          }}
          onAdd={addToCart}
        />
      )}

      <footer className="border-t border-line bg-[#f2f0e9]">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-7 text-xs text-[#777a71] sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
          <span>Casa Nativa · una tienda de demostración Ideal-IT</span>
          <span>Pagos simulados. Sin cargos ni pasarelas externas.</span>
        </div>
      </footer>
    </div>
  );
}

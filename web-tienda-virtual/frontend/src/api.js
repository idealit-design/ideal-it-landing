const API_BASE_URL = "http://127.0.0.1:8010";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request(path, { cartId, ...options } = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(cartId ? { "X-Cart-ID": cartId } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError(
      "No se pudo conectar con la API local. Comprueba que esté activa en el puerto 8010.",
      0,
    );
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const detail = body?.detail;
    throw new ApiError(
      typeof detail === "string" ? detail : `La solicitud falló (HTTP ${response.status}).`,
      response.status,
    );
  }

  if (response.status === 204) return null;
  return response.json();
}

const json = (path, method, body, cartId) =>
  request(path, {
    method,
    body: JSON.stringify(body),
    cartId,
  });

export const api = {
  async loadStore(cartId) {
    const [categorias, productos, carrito] = await Promise.all([
      request("/api/categorias"),
      request("/api/productos"),
      request("/api/carrito", { cartId }),
    ]);
    return { categorias, productos, carrito };
  },
  listProducts: (params = {}) => {
    const search = new URLSearchParams();
    if (params.categoria_id) search.set("categoria_id", params.categoria_id);
    if (params.q) search.set("q", params.q);
    const suffix = search.size ? `?${search}` : "";
    return request(`/api/productos${suffix}`);
  },
  getProduct: (id) => request(`/api/productos/${id}`),
  getCart: (cartId) => request("/api/carrito", { cartId }),
  addCartItem: (cartId, item) => json("/api/carrito/items", "POST", item, cartId),
  updateCartItem: (cartId, productId, cantidad) =>
    request(`/api/carrito/items/${productId}`, {
      method: "PATCH",
      body: JSON.stringify({ cantidad }),
      cartId,
      headers: { "Content-Type": "application/json" },
    }),
  removeCartItem: (cartId, productId) =>
    request(`/api/carrito/items/${productId}`, { method: "DELETE", cartId }),
  checkout: (cartId, customer) => json("/api/checkout", "POST", customer, cartId),
};

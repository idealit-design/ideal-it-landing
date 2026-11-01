const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8005";

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });
  } catch (cause) {
    const error = new Error("No se pudo conectar con la API OSMA.");
    error.name = "NetworkError";
    error.cause = cause;
    throw error;
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const detail = body?.detail ?? `La API respondió HTTP ${response.status}.`;
    throw new Error(Array.isArray(detail) ? detail.map((item) => item.msg).join(", ") : detail);
  }
  return response.status === 204 ? null : response.json();
}

export const getInspectors = () => request("/api/inspectores");
export const getInspections = () => request("/api/inspecciones");
export const searchAffiliates = (query = "") =>
  request(`/api/afiliados?q=${encodeURIComponent(query)}&limit=100`);
export const syncInspections = (records) =>
  request("/api/sync/inspecciones", {
    method: "POST",
    body: JSON.stringify(records),
  });

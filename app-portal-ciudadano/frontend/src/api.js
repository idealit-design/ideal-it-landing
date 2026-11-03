const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8011";

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
    const error = new Error("No se pudo conectar con la API local del Portal Ciudadano.");
    error.name = "NetworkError";
    error.cause = cause;
    throw error;
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const detail = body?.detail ?? `La API respondió HTTP ${response.status}.`;
    throw new Error(
      Array.isArray(detail) ? detail.map((item) => item.msg).join(", ") : detail,
    );
  }
  return response.status === 204 ? null : response.json();
}

const encode = encodeURIComponent;
const json = (body) => ({ method: "POST", body: JSON.stringify(body) });

export const getDashboard = (documento) =>
  Promise.all([
    request(`/api/tramites?documento=${encode(documento)}`),
    request(`/api/reclamos?documento=${encode(documento)}`),
    request(`/api/turnos?documento=${encode(documento)}`),
  ]).then(([tramites, reclamos, turnos]) => ({ tramites, reclamos, turnos }));

export const createClaim = (body) => request("/api/reclamos", json(body));
export const createApplication = (body) => request("/api/tramites", json(body));
export const getApplicationTypes = () => request("/api/tipos-tramite");
export const getTracking = (codigo) => request(`/api/seguimiento/${encode(codigo)}`);
export const createAppointment = (body) => request("/api/turnos", json(body));

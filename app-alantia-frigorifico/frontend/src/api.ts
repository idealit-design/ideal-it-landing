const API_BASE = import.meta.env.DEV ? "http://127.0.0.1:8008" : "";

export type CatalogItem = {
  id: number;
  nombre: string;
  tipo: "MEDIA_RES" | "CORTE" | "ELABORADO" | "SUBPRODUCTO" | "AVE";
  categoria: string;
  unidad: string;
  activo: boolean;
};

export type Provider = {
  id: number;
  razon_social: string;
  tipo: "FRIGORIFICO" | "AVICOLA" | "OTRO";
  activo: boolean;
};

export type Intake = {
  id: number;
  proveedor_id: number;
  catalogo_id: number;
  fecha_faena: string;
  numero_tropa: string;
  numero_garron: string;
  lateralidad: "I" | "D";
  peso_kg: number;
  peso_restante_kg: number;
  estado: "CAMARA" | "PARCIAL" | "DESPOSTADA";
  creado_en: string;
};

export type Stock = {
  id: number;
  catalogo_id: number;
  producto: string;
  tipo: CatalogItem["tipo"];
  cantidad_kg: number;
  actualizado_en: string;
};

export type Report = {
  productos_activos: number;
  ingresos_registrados: number;
  kg_ingresados: number;
  kg_despostados: number;
  stock_total_kg: number;
  stock_por_producto: Stock[];
};

export type Processing = {
  id: number;
  operacion_id: string;
  ingreso_id: number;
  catalogo_id: number;
  peso_kg: number;
  observaciones?: string | null;
  creado_en: string;
};

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.detail ?? `La API respondió ${response.status}.`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

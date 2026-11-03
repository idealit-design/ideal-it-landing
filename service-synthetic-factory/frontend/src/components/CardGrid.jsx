import { useMemo, useState } from "react";

const CATEGORIES = ["Todas", "Identidades", "Validadores", "Conversores", "Seguridad"];

export const CARDS = [
  {
    id: "profile",
    category: "Identidades",
    icon: "ID",
    title: "Perfiles & documentos",
    description: "Perfil ficticio con identificadores de prueba y credencial JPEG con marca visible.",
    endpoint: "POST /api/v1/generators/profiles",
  },
  {
    id: "medical",
    category: "Identidades",
    icon: "+",
    title: "Credenciales médicas",
    description: "Profesional sintético con especialidad, matrícula mock, PDF y JPEG.",
    endpoint: "POST /api/v1/generators/medical-credentials",
  },
  {
    id: "invoice",
    category: "Identidades",
    icon: "$",
    title: "Facturas & recibos mock",
    description: "Transacción comercial de demostración en JSON y PDF descargable.",
    endpoint: "POST /api/v1/generators/invoices",
  },
  {
    id: "structure",
    category: "Validadores",
    icon: "{}",
    title: "Estructuras & formatos",
    description: "JSON, esquema dinámico Pydantic, email, teléfono e identificador sintético.",
    endpoint: "POST /api/v1/validators/structure",
  },
  {
    id: "email",
    category: "Validadores",
    icon: "@",
    title: "Validador de correo",
    description: "Comprueba sintaxis y, opcionalmente, la existencia de registros MX del dominio.",
    endpoint: "POST /api/v1/validators/email",
  },
  {
    id: "identity-validator",
    category: "Validadores",
    icon: "ID",
    title: "DNI, CUIT y documentos regionales",
    description: "Verifica formatos y dígitos de control de Argentina, Chile y Uruguay.",
    endpoint: "POST /api/v1/validators/identity",
  },
  {
    id: "file",
    category: "Validadores",
    icon: "#",
    title: "Integridad de archivos",
    description: "SHA-256, MIME detectado y allowlist de tipos; sin análisis antimalware.",
    endpoint: "POST /api/v1/validators/file-integrity",
  },
  {
    id: "convert",
    category: "Conversores",
    icon: "↔",
    title: "Conversor universal",
    description: "JSON ↔ YAML, CSV ↔ JSON y tablas Markdown a HTML seguro.",
    endpoint: "POST /api/v1/converters/convert",
  },
  {
    id: "file-convert",
    category: "Conversores",
    icon: "⇧",
    title: "Conversor de archivos",
    description: "Transforma CSV a JSON, Markdown a PDF y comprime imágenes JPEG, PNG o WebP.",
    endpoint: "POST /api/v1/converters/files/*",
  },
  {
    id: "mock-data",
    category: "Conversores",
    icon: "50",
    title: "Mock data masivo",
    description: "Exporta hasta 500 usuarios o transacciones como JSON, CSV o SQL.",
    endpoint: "POST /api/v1/converters/mock-data",
  },
  {
    id: "mcp",
    category: "Seguridad",
    icon: "M",
    title: "Simulador de contexto MCP",
    description: "Inspecciona recursos y tools simuladas, sin transporte ni agentes externos.",
    endpoint: "GET /api/v1/mcp-bridge/status",
  },
  {
    id: "webhook",
    category: "Seguridad",
    icon: "↗",
    title: "Webhook tester",
    description: "Inspecciona headers, firma HMAC efímera y latencia; no envía tráfico.",
    endpoint: "POST /api/v1/mcp-bridge/webhooks/simulate",
  },
];

export default function CardGrid({ onSelect }) {
  const [category, setCategory] = useState("Todas");
  const [query, setQuery] = useState("");
  const visibleCards = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return CARDS.filter((card) =>
      (category === "Todas" || card.category === category) &&
      (!needle || `${card.title} ${card.description} ${card.category}`.toLocaleLowerCase().includes(needle)),
    );
  }, [category, query]);

  return (
    <section className="catalog" aria-label="Utilidades disponibles">
      <div className="catalog-heading">
        <div>
          <p className="eyebrow">CATÁLOGO DE UTILIDADES</p>
          <h2>¿Qué necesitas probar?</h2>
        </div>
        <label className="search-box">
          <span aria-hidden="true">⌕</span>
          <input
            aria-label="Buscar utilidades"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar una utilidad"
            type="search"
            value={query}
          />
        </label>
      </div>
      <div className="category-filters" aria-label="Filtrar por categoría">
        {CATEGORIES.map((item) => (
          <button
            aria-pressed={category === item}
            className={category === item ? "filter-chip active" : "filter-chip"}
            key={item}
            onClick={() => setCategory(item)}
            type="button"
          >
            {item}
          </button>
        ))}
      </div>
      <div className="card-grid">
        {visibleCards.map((card, index) => (
          <button
            className="utility-card"
            key={card.id}
            onClick={() => onSelect(card)}
            style={{ "--card-index": index }}
            type="button"
          >
            <span className="card-topline">
              <span className="card-icon">{card.icon}</span>
              <span className="card-category">{card.category}</span>
            </span>
            <strong>{card.title}</strong>
            <span className="card-description">{card.description}</span>
            <span className="card-endpoint">{card.endpoint}</span>
            <span className="card-open">Abrir herramienta <span aria-hidden="true">→</span></span>
          </button>
        ))}
        {visibleCards.length === 0 && (
          <p className="no-results">No hay utilidades que coincidan con esa búsqueda.</p>
        )}
      </div>
    </section>
  );
}

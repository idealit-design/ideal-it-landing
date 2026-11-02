import { useCallback, useEffect, useState } from "react";

import CardGrid, { CARDS } from "./components/CardGrid.jsx";
import Header from "./components/Header.jsx";
import ResultModal from "./components/ResultModal.jsx";
import ToolWorkspace from "./modules/ToolWorkspace.jsx";

async function request(path, body, method = "POST") {
  const options = { method };
  if (body instanceof FormData) {
    options.body = body;
  } else if (body !== null && body !== undefined) {
    options.headers = { "Content-Type": "application/json" };
    options.body = JSON.stringify(body);
  }
  const response = await fetch(path, options);
  const contentDisposition = response.headers.get("content-disposition");
  if (response.ok && contentDisposition) {
    const blob = await response.blob();
    const filename = contentDisposition.match(/filename="?([^";]+)"?/i)?.[1] || "factory-result.bin";
    return {
      filename,
      media_type: response.headers.get("content-type")?.split(";")[0] || blob.type,
      size_bytes: blob.size,
      _downloadBlob: blob,
    };
  }
  const result = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = result?.detail;
    const message = Array.isArray(detail)
      ? detail.map((item) => `${item.loc?.join(".")}: ${item.msg}`).join("; ")
      : detail;
    throw new Error(message || `Error HTTP ${response.status}`);
  }
  return result;
}

export default function App() {
  const [activeCard, setActiveCard] = useState(null);
  const [resultCard, setResultCard] = useState(null);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [apiStatus, setApiStatus] = useState("checking");

  const refreshHistory = useCallback(async () => {
    try {
      const [health, records] = await Promise.all([
        request("/health", null, "GET"),
        request("/api/v1/identities?limit=8", null, "GET"),
      ]);
      setApiStatus(health.status === "ok" ? "online" : "offline");
      setHistory(records);
    } catch (cause) {
      setApiStatus("offline");
      setError(cause.message);
    }
  }, []);

  useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);

  const showError = useCallback((cause) => {
    setError(cause instanceof Error ? cause.message : "No se pudo completar la operación.");
  }, []);

  const execute = useCallback(async (path, body, method = "POST") => {
    setLoading(true);
    setError("");
    try {
      const data = await request(path, body, method);
      setResult(data);
      setResultCard(activeCard);
      if (data?.id && data?.document_type) {
        setHistory((current) => [data, ...current.filter((item) => item.id !== data.id)].slice(0, 8));
      }
    } catch (cause) {
      showError(cause);
    } finally {
      setLoading(false);
    }
  }, [activeCard, showError]);

  function showPreviousRecord(record) {
    const card = CARDS.find((item) => item.id === (
      record.document_type === "medical_license" ? "medical" : "profile"
    ));
    setResultCard(card);
    setResult(record);
    setError("");
  }

  return (
    <main className="shell">
      <Header />
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">UTILITARIO AUTÓNOMO · FACTORY IDEAL-IT</p>
          <h1>Un laboratorio para datos de prueba.</h1>
          <p>
            Genera fixtures, valida formatos y convierte archivos desde un único
            centro. Los archivos y registros quedan locales; MX consulta solo el dominio.
          </p>
        </div>
        <div className={`api-status ${apiStatus}`} role="status">
          <span className="status-dot" />
          API local {apiStatus === "online" ? "conectada" : apiStatus === "checking" ? "verificando" : "sin conexión"}
        </div>
      </section>

      <section className="safety-banner" role="note">
        <span className="safety-symbol">!</span>
        <p><strong>Solo para demostración.</strong> Identidades, matrículas, facturas, hashes y firmas son datos sintéticos. Ningún documento tiene validez oficial; MCP y webhooks no realizan conexiones externas. La verificación MX consulta DNS para el dominio y no envía correos.</p>
      </section>

      {error && (
        <div className="feedback error" role="alert">
          <span>{error}</span>
          <button aria-label="Cerrar mensaje" onClick={() => setError("")} type="button">×</button>
        </div>
      )}

      <CardGrid onSelect={(card) => {
        setActiveCard(card);
        setError("");
      }} />

      {activeCard && (
        <ToolWorkspace
          card={activeCard}
          loading={loading}
          onClose={() => setActiveCard(null)}
          onError={showError}
          onExecute={execute}
        />
      )}

      <section className="history-section">
        <div className="section-title">
          <div>
            <p className="eyebrow">PERSISTENCIA LOCAL</p>
            <h2>Documentos recientes</h2>
          </div>
          <button className="text-button" onClick={refreshHistory} type="button">Actualizar</button>
        </div>
        {history.length ? (
          <div className="history-list">
            {history.map((record) => (
              <button className="history-item" key={record.id} onClick={() => showPreviousRecord(record)} type="button">
                <span className="history-avatar">{record.document_type === "dni" ? "ID" : "+"}</span>
                <span><strong>{record.full_name}</strong><small>{record.document_type === "dni" ? "Perfil sintético" : "Credencial médica ficticia"}</small></span>
                <span className="history-arrow">Ver →</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="empty-history">Los perfiles y credenciales generados aparecerán aquí.</div>
        )}
      </section>

      <footer className="app-footer">
        <span>SQLite exclusiva · datos y archivos locales · sin integración con otros MVP</span>
        <span>Ideal-IT · Service Synthetic Factory</span>
      </footer>

      {resultCard && result && (
        <ResultModal
          card={resultCard}
          onClose={() => {
            setResultCard(null);
            setResult(null);
          }}
          result={result}
        />
      )}
    </main>
  );
}

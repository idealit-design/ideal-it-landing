import { useEffect, useState } from "react";

function downloadText(content, filename, mediaType = "text/plain") {
  const url = URL.createObjectURL(new Blob([content], { type: mediaType }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename || "factory-result.txt";
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function ResultModal({ card, result, onClose }) {
  const [copyStatus, setCopyStatus] = useState("");

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const assets = result?.assets ?? [];
  const image = assets.find((asset) => asset.media_type.startsWith("image/"));
  const pdf = assets.find((asset) => asset.media_type === "application/pdf");
  const downloadable = typeof result?.content === "string" || result?._downloadBlob ? result : null;

  async function copyResult() {
    try {
      const { _downloadBlob, ...payload } = result;
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      setCopyStatus("JSON copiado al portapapeles.");
    } catch {
      setCopyStatus("No se pudo acceder al portapapeles en este navegador.");
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section aria-labelledby="result-title" aria-modal="true" className="result-modal" role="dialog">
        <header className="modal-header">
          <div>
            <p className="eyebrow">RESULTADO DE EJECUCIÓN</p>
            <h2 id="result-title">{card.title}</h2>
          </div>
          <button aria-label="Cerrar resultado" className="icon-button" onClick={onClose} type="button">×</button>
        </header>
        {(image || pdf) && (
          <div className="result-preview">
            {image && <img alt="Vista previa del documento sintético" src={image.url} />}
            {pdf && <iframe title="Documento PDF de demostración" src={pdf.url} />}
          </div>
        )}
        {assets.length > 0 && (
          <div className="result-downloads">
            {assets.map((asset) => (
              <a className="button button-subtle" download={asset.filename} href={`${asset.url}?download=true`} key={asset.filename}>
                Descargar {asset.media_type === "application/pdf" ? "PDF" : "JPEG"}
              </a>
            ))}
          </div>
        )}
        <div className="result-downloads">
          <button className="button button-subtle" onClick={copyResult} type="button">
            Copiar JSON estructurado
          </button>
        </div>
        {copyStatus && <p className="copy-status" role="status">{copyStatus}</p>}
        {downloadable && (
          <div className="result-downloads">
            <button
              className="button button-subtle"
              onClick={() => {
                if (downloadable._downloadBlob) {
                  const url = URL.createObjectURL(downloadable._downloadBlob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = downloadable.filename;
                  link.click();
                  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
                } else {
                  downloadText(downloadable.content, downloadable.filename, downloadable.media_type);
                }
              }}
              type="button"
            >
              Descargar {downloadable.filename}
            </button>
          </div>
        )}
        <pre className="result-json">{JSON.stringify(result, null, 2)}</pre>
        <footer className="modal-footer">
          <span>Datos sintéticos · almacenados solo localmente</span>
          <button className="button button-primary" onClick={onClose} type="button">Cerrar</button>
        </footer>
      </section>
    </div>
  );
}

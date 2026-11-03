import { useState } from "react";

function Field({ label, children, hint }) {
  return (
    <label className="form-field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}

function TextArea({ value, onChange, rows = 7, ...props }) {
  return (
    <textarea
      onChange={(event) => onChange(event.target.value)}
      rows={rows}
      value={value}
      {...props}
    />
  );
}

export default function ToolWorkspace({ card, loading, onExecute, onError, onClose }) {
  const [rows, setRows] = useState("50");
  const [dataset, setDataset] = useState("users");
  const [format, setFormat] = useState("json");
  const [source, setSource] = useState("json");
  const [target, setTarget] = useState("yaml");
  const [content, setContent] = useState('{\n  "sample": true,\n  "count": 3\n}');
  const [schema, setSchema] = useState('{\n  "type": "object",\n  "required": ["id"],\n  "properties": {\n    "id": { "type": "string" },\n    "active": { "type": "boolean" }\n  }\n}');
  const [email, setEmail] = useState("demo@example.invalid");
  const [checkMx, setCheckMx] = useState(true);
  const [region, setRegion] = useState("AR");
  const [documentType, setDocumentType] = useState("dni");
  const [phone, setPhone] = useState("000-000-0000");
  const [taxIdentifier, setTaxIdentifier] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [imageQuality, setImageQuality] = useState("75");
  const [itemCount, setItemCount] = useState("3");
  const [eventName, setEventName] = useState("payment.updated");
  const [toolText, setToolText] = useState("Fixture de prueba local");
  const [webhookPayload, setWebhookPayload] = useState('{\n  "transaction_id": "SYN-TXN-001",\n  "status": "paid"\n}');

  async function submit(event) {
    event.preventDefault();
    if (card.id === "profile") return onExecute("/api/v1/generators/profiles", {});
    if (card.id === "medical") return onExecute("/api/v1/generators/medical-credentials", {});
    if (card.id === "invoice") {
      return onExecute("/api/v1/generators/invoices", {
        item_count: Number(itemCount),
        payment_method: "simulado",
      });
    }
    if (card.id === "structure") {
      let parsedSchema;
      try {
        parsedSchema = schema.trim() ? JSON.parse(schema) : null;
      } catch {
        throw new Error("El esquema debe ser JSON válido.");
      }
      const formats = Object.fromEntries(
        Object.entries({ email, phone, tax_identifier: taxIdentifier }).filter(([, value]) => value.trim()),
      );
      return onExecute("/api/v1/validators/structure", {
        data: content,
        schema: parsedSchema,
        formats,
      });
    }
    if (card.id === "email") {
      return onExecute("/api/v1/validators/email", {
        email,
        check_mx: checkMx,
      });
    }
    if (card.id === "identity-validator") {
      return onExecute("/api/v1/validators/identity", {
        region,
        document_type: documentType,
        value: taxIdentifier,
      });
    }
    if (card.id === "file") {
      if (!selectedFile) throw new Error("Selecciona un archivo local para analizar.");
      const body = new FormData();
      body.append("file", selectedFile);
      return onExecute("/api/v1/validators/file-integrity", body);
    }
    if (card.id === "convert") {
      return onExecute("/api/v1/converters/convert", { source, target, content });
    }
    if (card.id === "file-convert") {
      if (!selectedFile) throw new Error("Selecciona un archivo local para convertir.");
      const body = new FormData();
      body.append("file", selectedFile);
      if (selectedFile.type.startsWith("image/")) {
        body.append("quality", imageQuality);
        return onExecute("/api/v1/converters/files/compress-image", body);
      }
      if (selectedFile.name.toLowerCase().endsWith(".csv")) {
        return onExecute("/api/v1/converters/files/csv-to-json", body);
      }
      if (selectedFile.name.toLowerCase().endsWith(".md") || selectedFile.name.toLowerCase().endsWith(".markdown")) {
        return onExecute("/api/v1/converters/files/markdown-to-pdf", body);
      }
      throw new Error("Usa un archivo CSV, Markdown o una imagen JPEG, PNG o WebP.");
    }
    if (card.id === "mock-data") {
      return onExecute("/api/v1/converters/mock-data", {
        rows: Number(rows),
        dataset,
        format,
      });
    }
    if (card.id === "webhook") {
      let payload;
      try {
        payload = JSON.parse(webhookPayload);
      } catch {
        throw new Error("El payload del webhook debe ser JSON válido.");
      }
      if (!payload || Array.isArray(payload) || typeof payload !== "object") {
        throw new Error("El payload debe ser un objeto JSON.");
      }
      return onExecute("/api/v1/mcp-bridge/webhooks/simulate", {
        event: eventName,
        payload,
      });
    }
    if (card.id === "mcp") {
      return onExecute("/api/v1/mcp-bridge/status", null, "GET");
    }
  }

  async function callMcpTool(name) {
    return onExecute(`/api/v1/mcp-bridge/tools/${name}`, { text: toolText });
  }

  return (
    <section className="workspace panel" aria-labelledby="workspace-title">
      <header className="workspace-heading">
        <div>
          <p className="eyebrow">{card.category} · HERRAMIENTA LOCAL</p>
          <h2 id="workspace-title">{card.title}</h2>
          <p className="workspace-description">{card.description}</p>
        </div>
        <button aria-label="Cerrar herramienta" className="icon-button" onClick={onClose} type="button">×</button>
      </header>

      {card.id === "mcp" ? (
        <div className="mcp-controls">
          <p className="safety-note">Simulación en proceso local. No expone un servidor MCP remoto ni conecta agentes.</p>
          <Field label="Texto para la tool echo_fixture">
            <input onChange={(event) => setToolText(event.target.value)} value={toolText} />
          </Field>
          <div className="form-actions">
            <button className="button button-primary" disabled={loading} onClick={() => onExecute("/api/v1/mcp-bridge/status", null, "GET")} type="button">
              Consultar estado
            </button>
            <button className="button button-subtle" disabled={loading} onClick={() => onExecute("/api/v1/mcp-bridge/resources", null, "GET")} type="button">
              Ver recursos
            </button>
            <button className="button button-subtle" disabled={loading} onClick={() => onExecute("/api/v1/mcp-bridge/tools", null, "GET")} type="button">
              Ver tools
            </button>
            <button className="button button-subtle" disabled={loading} onClick={() => callMcpTool("echo_fixture")} type="button">
              Ejecutar echo
            </button>
            <button className="button button-subtle" disabled={loading} onClick={() => callMcpTool("list_capabilities")} type="button">
              Ejecutar capabilities
            </button>
          </div>
        </div>
      ) : (
        <form className="tool-form" onSubmit={(event) => submit(event).catch(onError)}>
          {card.id === "profile" && (
            <p className="safety-note">DNI/CUIT de namespace sintético, dirección inventada y avatar ilustrado. Los documentos incluyen marcas de ficción y no validez.</p>
          )}
          {card.id === "medical" && (
            <p className="safety-note">La matrícula y la especialidad son inventadas. El PDF/JPEG no acredita formación ni habilitación profesional.</p>
          )}
          {card.id === "invoice" && (
            <Field label="Cantidad de conceptos">
              <input max="10" min="1" onChange={(event) => setItemCount(event.target.value)} type="number" value={itemCount} />
            </Field>
          )}
          {card.id === "structure" && (
            <>
              <div className="form-grid">
                <Field label="JSON a validar">
                  <TextArea onChange={setContent} value={content} />
                </Field>
                <Field label="Esquema Pydantic dinámico" hint="Opcional · admite propiedades, tipos básicos, required y enum.">
                  <TextArea onChange={setSchema} value={schema} />
                </Field>
              </div>
              <div className="form-grid form-grid-three">
                <Field label="Email">
                  <input onChange={(event) => setEmail(event.target.value)} value={email} />
                </Field>
                <Field label="Teléfono">
                  <input onChange={(event) => setPhone(event.target.value)} value={phone} />
                </Field>
                <Field label="Identificador sintético (opcional)">
                  <input onChange={(event) => setTaxIdentifier(event.target.value)} placeholder="00-00000000-0" value={taxIdentifier} />
                </Field>
              </div>
            </>
          )}
          {card.id === "email" && (
            <>
              <Field label="Dirección de correo" hint="La comprobación MX consulta el DNS del dominio; no confirma que el buzón exista.">
                <input autoComplete="email" onChange={(event) => setEmail(event.target.value)} type="email" value={email} />
              </Field>
              <label className="check-field">
                <input checked={checkMx} onChange={(event) => setCheckMx(event.target.checked)} type="checkbox" />
                Consultar registros MX del dominio
              </label>
            </>
          )}
          {card.id === "identity-validator" && (
            <>
              <div className="form-grid">
                <Field label="Región">
                  <select onChange={(event) => {
                    setRegion(event.target.value);
                    setDocumentType(event.target.value === "AR" ? "dni" : event.target.value === "CL" ? "rut" : "ci");
                  }} value={region}>
                    <option value="AR">Argentina</option><option value="CL">Chile</option><option value="UY">Uruguay</option>
                  </select>
                </Field>
                <Field label="Tipo de documento">
                  <select onChange={(event) => setDocumentType(event.target.value)} value={documentType}>
                    {region === "AR" ? (
                      <><option value="dni">DNI</option><option value="cuit">CUIT</option></>
                    ) : region === "CL" ? (
                      <option value="rut">RUT</option>
                    ) : (
                      <option value="ci">Cédula de identidad</option>
                    )}
                  </select>
                </Field>
              </div>
              <Field label="Número de documento">
                <input onChange={(event) => setTaxIdentifier(event.target.value)} placeholder={region === "AR" ? (documentType === "dni" ? "12345678" : "20-12345678-6") : region === "CL" ? "12.345.678-5" : "12345678"} value={taxIdentifier} />
              </Field>
            </>
          )}
          {card.id === "file" && (
            <Field label="Archivo local" hint="Máximo 10 MB. No se guarda, ejecuta ni analiza en busca de malware.">
              <input
                accept=".csv,.json,.md,.pdf,.png,.jpg,.jpeg,.txt,.xml"
                onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                type="file"
              />
              {selectedFile && <small className="file-selected">{selectedFile.name} · {selectedFile.size.toLocaleString()} bytes</small>}
            </Field>
          )}
          {card.id === "file-convert" && (
            <>
              <p className="safety-note">Archivos locales de hasta 10 MB. CSV genera JSON, Markdown genera PDF y las imágenes se convierten a JPEG optimizado.</p>
              <Field label="Archivo local" hint="Formatos: .csv, .md, .markdown, .jpg, .jpeg, .png o .webp">
                <input
                  accept=".csv,.md,.markdown,.jpg,.jpeg,.png,.webp"
                  onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                  type="file"
                />
                {selectedFile && <small className="file-selected">{selectedFile.name} · {selectedFile.size.toLocaleString()} bytes</small>}
              </Field>
              {selectedFile?.type.startsWith("image/") && (
                <Field label={`Calidad JPEG: ${imageQuality}`}>
                  <input max="95" min="20" onChange={(event) => setImageQuality(event.target.value)} type="range" value={imageQuality} />
                </Field>
              )}
            </>
          )}
          {card.id === "convert" && (
            <>
              <div className="form-grid form-grid-three">
                <Field label="Formato de origen">
                  <select onChange={(event) => setSource(event.target.value)} value={source}>
                    <option value="json">JSON</option><option value="yaml">YAML</option>
                    <option value="csv">CSV</option><option value="markdown">Markdown</option>
                  </select>
                </Field>
                <Field label="Formato de destino">
                  <select onChange={(event) => setTarget(event.target.value)} value={target}>
                    <option value="json">JSON</option><option value="yaml">YAML</option>
                    <option value="csv">CSV</option><option value="html">HTML</option>
                  </select>
                </Field>
                <p className="field-hint">Markdown solo se convierte a HTML. CSV se transforma a JSON y viceversa.</p>
              </div>
              <Field label="Contenido de entrada">
                <TextArea onChange={setContent} value={content} />
              </Field>
            </>
          )}
          {card.id === "mock-data" && (
            <div className="form-grid form-grid-three">
              <Field label="Filas (1–500)">
                <input max="500" min="1" onChange={(event) => setRows(event.target.value)} type="number" value={rows} />
              </Field>
              <Field label="Dataset">
                <select onChange={(event) => setDataset(event.target.value)} value={dataset}>
                  <option value="users">Usuarios</option><option value="transactions">Transacciones</option>
                </select>
              </Field>
              <Field label="Exportar como">
                <select onChange={(event) => setFormat(event.target.value)} value={format}>
                  <option value="json">JSON</option><option value="csv">CSV</option><option value="sql">SQL INSERT</option>
                </select>
              </Field>
            </div>
          )}
          {card.id === "webhook" && (
            <>
              <p className="safety-note">No se envía ninguna petición a una URL externa ni se escucha en una interfaz de red. La firma usa una clave efímera local.</p>
              <Field label="Nombre del evento">
                <input onChange={(event) => setEventName(event.target.value)} value={eventName} />
              </Field>
              <Field label="Payload JSON">
                <TextArea onChange={setWebhookPayload} value={webhookPayload} />
              </Field>
            </>
          )}
          <div className="form-actions">
            <button className="button button-primary" disabled={loading} type="submit">
              {loading ? "Ejecutando…" : card.id === "file" ? "Calcular hash y verificar" : card.id === "file-convert" ? "Convertir y descargar" : "Ejecutar utilidad"}
            </button>
            <span className="endpoint-label">{card.endpoint}</span>
          </div>
        </form>
      )}
    </section>
  );
}

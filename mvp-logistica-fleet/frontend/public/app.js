const api = "/api";
const statusStyles = {
  DISPONIBLE: "bg-emerald-50 text-emerald-700",
  EN_RUTA: "bg-blue-50 text-blue-700",
  TALLER: "bg-amber-50 text-amber-700",
  PENDIENTE: "bg-slate-100 text-slate-600",
  EN_CAMINO: "bg-blue-50 text-blue-700",
  ENTREGADO: "bg-emerald-50 text-emerald-700",
};

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

async function request(path, options = {}) {
  const response = await fetch(`${api}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || `Error HTTP ${response.status}`);
  return data;
}

function badge(status) {
  return `<span class="rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[status] || "bg-slate-100 text-slate-600"}">${escapeHtml(status.replaceAll("_", " "))}</span>`;
}

async function refreshDashboard() {
  const [vehicles, drivers, shipments] = await Promise.all([
    request("/flota"),
    request("/flota/conductores"),
    request("/envios"),
  ]);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayShipments = shipments.filter((shipment) => new Date(shipment.fecha_creacion) >= today);

  document.querySelector("#stat-vehicles").textContent = vehicles.length;
  document.querySelector("#stat-available").textContent = `${vehicles.filter((item) => item.estado === "DISPONIBLE").length} disponibles`;
  document.querySelector("#stat-shipments").textContent = todayShipments.length;
  document.querySelector("#stat-moving").textContent = `${todayShipments.filter((item) => item.estado_envio === "EN_CAMINO").length} en camino`;
  document.querySelector("#stat-delivered").textContent = todayShipments.filter((item) => item.estado_envio === "ENTREGADO").length;
  document.querySelector("#stat-drivers").textContent = drivers.length;

  document.querySelector("#vehicle-rows").innerHTML = vehicles.length
    ? vehicles.map((vehicle) => `<tr><td class="px-5 py-4 font-semibold">${escapeHtml(vehicle.modelo)}</td><td class="px-5 py-4 font-mono text-xs">${escapeHtml(vehicle.patente)}</td><td class="px-5 py-4 text-slate-500">${Number(vehicle.kilometraje).toLocaleString("es-AR")} km</td><td class="px-5 py-4">${badge(vehicle.estado)}</td></tr>`).join("")
    : '<tr><td colspan="4" class="px-5 py-8 text-center text-slate-400">Aún no hay vehículos registrados.</td></tr>';

  document.querySelector("#shipment-rows").innerHTML = shipments.length
    ? shipments.slice(0, 12).map((shipment) => {
      const driver = shipment.conductor ? `${shipment.conductor.nombre} ${shipment.conductor.apellido}` : "Sin asignar";
      return `<tr><td class="px-5 py-4 font-mono text-xs font-semibold text-slate-700">${escapeHtml(shipment.tracking_code)}</td><td class="max-w-48 truncate px-5 py-4 text-slate-600" title="${escapeHtml(shipment.direccion_destino)}">${escapeHtml(shipment.direccion_destino)}</td><td class="px-5 py-4 text-slate-500">${escapeHtml(driver)}</td><td class="px-5 py-4">${badge(shipment.estado_envio)}</td></tr>`;
    }).join("")
    : '<tr><td colspan="4" class="px-5 py-8 text-center text-slate-400">Aún no hay envíos registrados.</td></tr>';
}

function showNotice(message, isError = false) {
  const notice = document.querySelector("#notice");
  notice.textContent = message;
  notice.className = `mt-4 min-h-5 text-xs ${isError ? "text-rose-600" : "text-slate-500"}`;
}

document.querySelector("#refresh-button").addEventListener("click", async () => {
  try {
    await refreshDashboard();
    showNotice("Datos actualizados.");
  } catch (error) {
    showNotice(error.message, true);
  }
});

document.querySelector("#vehicle-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  try {
    await request("/flota", {
      method: "POST",
      body: JSON.stringify({
        patente: form.get("patente"),
        modelo: form.get("modelo"),
        kilometraje: Number(form.get("kilometraje")),
      }),
    });
    event.currentTarget.reset();
    event.currentTarget.elements.kilometraje.value = 0;
    await refreshDashboard();
    showNotice("Vehículo registrado correctamente.");
  } catch (error) {
    showNotice(error.message, true);
  }
});

document.querySelector("#shipment-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  try {
    const shipment = await request("/envios", {
      method: "POST",
      body: JSON.stringify({ direccion_destino: form.get("direccion_destino") }),
    });
    event.currentTarget.reset();
    await refreshDashboard();
    showNotice(`Envío ${shipment.tracking_code} registrado: ${shipment.estado_envio.replaceAll("_", " ")}.`);
  } catch (error) {
    showNotice(error.message, true);
  }
});

document.querySelector("#backup-button").addEventListener("click", async (event) => {
  const button = event.currentTarget;
  button.disabled = true;
  try {
    const result = await request("/sync/ssh-backup", { method: "POST" });
    const output = document.querySelector("#backup-result");
    output.innerHTML = `<p class="font-bold">Respaldo simulado exitoso</p><p class="mt-1">${escapeHtml(result.operation.archiveName)} · ${Number(result.operation.bytesSent).toLocaleString("es-AR")} bytes</p><p class="mt-1 break-words">${escapeHtml(result.operation.connection)}</p>`;
    output.classList.remove("hidden");
    showNotice("Se generó el registro de sincronización.");
  } catch (error) {
    showNotice(error.message, true);
  } finally {
    button.disabled = false;
  }
});

refreshDashboard().catch((error) => showNotice(error.message, true));

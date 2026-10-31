import { prisma } from "../config/db";

export async function simulateSshBackup() {
  const now = new Date();
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);

  const [total, pendientes, enCamino, entregados, vehiculosDisponibles, vehiculosEnRuta] = await Promise.all([
    prisma.envio.count({ where: { fecha_creacion: { gte: dayStart } } }),
    prisma.envio.count({ where: { fecha_creacion: { gte: dayStart }, estado_envio: "PENDIENTE" } }),
    prisma.envio.count({ where: { fecha_creacion: { gte: dayStart }, estado_envio: "EN_CAMINO" } }),
    prisma.envio.count({ where: { fecha_creacion: { gte: dayStart }, estado_envio: "ENTREGADO" } }),
    prisma.vehiculo.count({ where: { estado: "DISPONIBLE" } }),
    prisma.vehiculo.count({ where: { estado: "EN_RUTA" } }),
  ]);
  const report = {
    generatedAt: now.toISOString(),
    range: "dia actual",
    statistics: { envios: { total, pendientes, enCamino, entregados }, flota: { vehiculosDisponibles, vehiculosEnRuta } },
  };
  const archive = JSON.stringify(report, null, 2);
  const target = process.env.SSH_BACKUP_TARGET ?? "ubuntu@192.168.50.10:22";
  const bytesSent = Buffer.byteLength(archive, "utf8");
  const log = await prisma.logSshSync.create({
    data: {
      servidor_destino: target,
      estado_transferencia: "EXITOSO",
      bytes_enviados: bytesSent,
    },
  });

  return {
    log,
    operation: {
      protocol: "SFTP simulado",
      connection: `Conexion SSH simulada a ${target}; no se establecio ninguna conexion de red.`,
      archiveName: `fleet-backup-${now.toISOString().slice(0, 10)}.json`,
      bytesSent,
      report,
    },
  };
}

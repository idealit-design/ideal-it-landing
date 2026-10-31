import { randomUUID } from "node:crypto";
import { EstadoEnvio } from "@prisma/client";
import { Router } from "express";
import { prisma } from "../config/db";

const router = Router();
const estadosEnvio = Object.values(EstadoEnvio);

router.get("/", async (_req, res, next) => {
  try {
    const envios = await prisma.envio.findMany({
      include: { vehiculo: true, conductor: true },
      orderBy: { fecha_creacion: "desc" },
    });
    res.json(envios);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { direccion_destino, vehiculoId, conductorId } = req.body as {
      direccion_destino?: unknown;
      vehiculoId?: unknown;
      conductorId?: unknown;
    };
    if (typeof direccion_destino !== "string" || !direccion_destino.trim()) {
      res.status(400).json({ error: "La direccion de destino es obligatoria." });
      return;
    }
    if (
      (vehiculoId !== undefined && typeof vehiculoId !== "string") ||
      (conductorId !== undefined && typeof conductorId !== "string")
    ) {
      res.status(400).json({ error: "Los identificadores de vehiculo y conductor deben ser texto." });
      return;
    }

    const envio = await prisma.$transaction(async (tx) => {
      const vehiculo = vehiculoId
        ? await tx.vehiculo.findUnique({ where: { id: vehiculoId } })
        : await tx.vehiculo.findFirst({ where: { estado: "DISPONIBLE" }, orderBy: { creadoEn: "asc" } });
      if (vehiculoId && (!vehiculo || vehiculo.estado !== "DISPONIBLE")) {
        throw new Error("VEHICULO_NO_DISPONIBLE");
      }

      const conductor = conductorId
        ? await tx.conductor.findUnique({ where: { id: conductorId } })
        : await tx.conductor.findFirst({
            where: { envios: { none: { estado_envio: "EN_CAMINO" } } },
            orderBy: { creadoEn: "asc" },
          });
      if (conductorId && !conductor) {
        throw new Error("CONDUCTOR_NO_ENCONTRADO");
      }
      if (
        conductor &&
        (await tx.envio.count({ where: { conductorId: conductor.id, estado_envio: "EN_CAMINO" } })) > 0
      ) {
        throw new Error("CONDUCTOR_OCUPADO");
      }
      if ((vehiculoId || conductorId) && (!vehiculo || !conductor)) {
        throw new Error("ASIGNACION_INCOMPLETA");
      }

      const assigned = Boolean(vehiculo && conductor);
      const created = await tx.envio.create({
        data: {
          tracking_code: `LF-${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`,
          direccion_destino: direccion_destino.trim(),
          estado_envio: assigned ? "EN_CAMINO" : "PENDIENTE",
          vehiculoId: assigned ? vehiculo?.id : null,
          conductorId: assigned ? conductor?.id : null,
        },
        include: { vehiculo: true, conductor: true },
      });
      if (assigned && vehiculo) {
        await tx.vehiculo.update({ where: { id: vehiculo.id }, data: { estado: "EN_RUTA" } });
      }
      return created;
    });
    res.status(201).json(envio);
  } catch (error) {
    next(error);
  }
});

router.post("/:id/asignar", async (req, res, next) => {
  try {
    const envio = await prisma.$transaction(async (tx) => {
      const existing = await tx.envio.findUnique({ where: { id: req.params.id } });
      if (!existing) throw new Error("ENVIO_NO_ENCONTRADO");
      if (existing.estado_envio !== "PENDIENTE") throw new Error("ENVIO_NO_PENDIENTE");

      const vehiculo = await tx.vehiculo.findFirst({
        where: { estado: "DISPONIBLE" },
        orderBy: { creadoEn: "asc" },
      });
      const conductor = await tx.conductor.findFirst({
        where: { envios: { none: { estado_envio: "EN_CAMINO" } } },
        orderBy: { creadoEn: "asc" },
      });
      if (!vehiculo || !conductor) throw new Error("RECURSOS_NO_DISPONIBLES");

      await tx.vehiculo.update({ where: { id: vehiculo.id }, data: { estado: "EN_RUTA" } });
      return tx.envio.update({
        where: { id: existing.id },
        data: { estado_envio: "EN_CAMINO", vehiculoId: vehiculo.id, conductorId: conductor.id },
        include: { vehiculo: true, conductor: true },
      });
    });
    res.json(envio);
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/estado", async (req, res, next) => {
  try {
    const { estado_envio } = req.body as { estado_envio?: unknown };
    if (typeof estado_envio !== "string" || !estadosEnvio.includes(estado_envio as EstadoEnvio)) {
      res.status(400).json({ error: `Estado invalido. Valores permitidos: ${estadosEnvio.join(", ")}.` });
      return;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const existing = await tx.envio.findUnique({ where: { id: req.params.id } });
      if (!existing) throw new Error("ENVIO_NO_ENCONTRADO");
      if (existing.estado_envio === "ENTREGADO" && estado_envio !== "ENTREGADO") {
        throw new Error("ENVIO_YA_ENTREGADO");
      }
      if (existing.estado_envio === "EN_CAMINO" && estado_envio === "PENDIENTE") {
        throw new Error("ENVIO_NO_PUEDE_VOLVER_A_PENDIENTE");
      }
      if (estado_envio === "ENTREGADO" && existing.estado_envio !== "EN_CAMINO") {
        throw new Error("ENVIO_NO_EN_CAMINO");
      }
      if (estado_envio === "EN_CAMINO" && existing.estado_envio === "PENDIENTE") {
        if (!existing.vehiculoId || !existing.conductorId) throw new Error("ENVIO_SIN_ASIGNACION");
        const [vehiculo, conductorOcupado] = await Promise.all([
          tx.vehiculo.findUnique({ where: { id: existing.vehiculoId } }),
          tx.envio.count({
            where: {
              conductorId: existing.conductorId,
              estado_envio: "EN_CAMINO",
              id: { not: existing.id },
            },
          }),
        ]);
        if (!vehiculo || vehiculo.estado !== "DISPONIBLE" || conductorOcupado > 0) {
          throw new Error("RECURSOS_NO_DISPONIBLES");
        }
        await tx.vehiculo.update({ where: { id: vehiculo.id }, data: { estado: "EN_RUTA" } });
      }
      const envio = await tx.envio.update({
        where: { id: existing.id },
        data: { estado_envio: estado_envio as EstadoEnvio },
        include: { vehiculo: true, conductor: true },
      });
      if (estado_envio === "ENTREGADO" && existing.vehiculoId) {
        const remaining = await tx.envio.count({
          where: {
            id: { not: existing.id },
            vehiculoId: existing.vehiculoId,
            estado_envio: "EN_CAMINO",
          },
        });
        if (remaining === 0) {
          await tx.vehiculo.update({ where: { id: existing.vehiculoId }, data: { estado: "DISPONIBLE" } });
        }
      }
      return envio;
    });
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

export default router;

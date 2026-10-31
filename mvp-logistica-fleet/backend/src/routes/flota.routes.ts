import { EstadoVehiculo } from "@prisma/client";
import { Router } from "express";
import { prisma } from "../config/db";

const router = Router();
const estadosVehiculo = Object.values(EstadoVehiculo);

router.get("/", async (_req, res, next) => {
  try {
    const vehiculos = await prisma.vehiculo.findMany({
      include: { _count: { select: { envios: true } } },
      orderBy: { patente: "asc" },
    });
    res.json(vehiculos);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { patente, modelo, kilometraje = 0 } = req.body as {
      patente?: unknown;
      modelo?: unknown;
      kilometraje?: unknown;
    };
    if (
      typeof patente !== "string" ||
      !patente.trim() ||
      typeof modelo !== "string" ||
      !modelo.trim() ||
      !Number.isInteger(kilometraje) ||
      (kilometraje as number) < 0
    ) {
      res.status(400).json({ error: "Patente, modelo y kilometraje valido son obligatorios." });
      return;
    }

    const vehiculo = await prisma.vehiculo.create({
      data: { patente: patente.trim().toUpperCase(), modelo: modelo.trim(), kilometraje: kilometraje as number },
    });
    res.status(201).json(vehiculo);
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/estado", async (req, res, next) => {
  try {
    const { estado } = req.body as { estado?: unknown };
    if (typeof estado !== "string" || !estadosVehiculo.includes(estado as EstadoVehiculo)) {
      res.status(400).json({ error: `Estado invalido. Valores permitidos: ${estadosVehiculo.join(", ")}.` });
      return;
    }

    const vehicle = await prisma.vehiculo.findUnique({ where: { id: req.params.id } });
    if (!vehicle) {
      res.status(404).json({ error: "Vehiculo no encontrado." });
      return;
    }
    if (estado !== "EN_RUTA") {
      const activeShipments = await prisma.envio.count({
        where: { vehiculoId: vehicle.id, estado_envio: "EN_CAMINO" },
      });
      if (activeShipments > 0) {
        res.status(409).json({ error: "No se puede cambiar el estado: el vehiculo tiene envios en camino." });
        return;
      }
    }

    const updated = await prisma.vehiculo.update({
      where: { id: vehicle.id },
      data: { estado: estado as EstadoVehiculo },
    });
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

router.get("/conductores", async (_req, res, next) => {
  try {
    const conductores = await prisma.conductor.findMany({ orderBy: [{ apellido: "asc" }, { nombre: "asc" }] });
    res.json(conductores);
  } catch (error) {
    next(error);
  }
});

router.post("/conductores", async (req, res, next) => {
  try {
    const { dni, nombre, apellido, licencia, telefono } = req.body as Record<string, unknown>;
    const fields = [dni, nombre, apellido, licencia, telefono];
    if (fields.some((value) => typeof value !== "string" || !value.trim())) {
      res.status(400).json({ error: "DNI, nombre, apellido, licencia y telefono son obligatorios." });
      return;
    }
    const conductor = await prisma.conductor.create({
      data: {
        dni: (dni as string).trim(),
        nombre: (nombre as string).trim(),
        apellido: (apellido as string).trim(),
        licencia: (licencia as string).trim(),
        telefono: (telefono as string).trim(),
      },
    });
    res.status(201).json(conductor);
  } catch (error) {
    next(error);
  }
});

export default router;

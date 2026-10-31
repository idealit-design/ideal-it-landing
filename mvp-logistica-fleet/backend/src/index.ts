import "dotenv/config";
import path from "node:path";
import cors from "cors";
import express, { ErrorRequestHandler } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "./config/db";
import enviosRouter from "./routes/envios.routes";
import flotaRouter from "./routes/flota.routes";
import sshSyncRouter from "./routes/ssh-sync.routes";

const app = express();
const port = Number(process.env.PORT ?? 4100);

app.use(cors());
app.use(express.json({ limit: "64kb" }));
app.use(express.static(path.resolve(__dirname, "../../frontend/public")));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", version: "0.1.1" });
});
app.use("/api/flota", flotaRouter);
app.use("/api/envios", enviosRouter);
app.use("/api/sync", sshSyncRouter);

const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  if (error instanceof Error) {
    const knownResponses: Record<string, { status: number; message: string }> = {
      VEHICULO_NO_DISPONIBLE: { status: 409, message: "El vehiculo solicitado no esta disponible." },
      CONDUCTOR_NO_ENCONTRADO: { status: 404, message: "Conductor no encontrado." },
      CONDUCTOR_OCUPADO: { status: 409, message: "El conductor ya tiene un envio en camino." },
      ASIGNACION_INCOMPLETA: { status: 409, message: "Se necesita un vehiculo y un conductor disponibles para asignar." },
      ENVIO_NO_ENCONTRADO: { status: 404, message: "Envio no encontrado." },
      ENVIO_NO_PENDIENTE: { status: 409, message: "Solo se pueden asignar envios pendientes." },
      RECURSOS_NO_DISPONIBLES: { status: 409, message: "No hay vehiculo y conductor disponibles." },
      ENVIO_SIN_ASIGNACION: { status: 409, message: "Asigne un vehiculo y conductor antes de iniciar el envio." },
      ENVIO_YA_ENTREGADO: { status: 409, message: "Un envio entregado no puede reabrirse." },
      ENVIO_NO_EN_CAMINO: { status: 409, message: "Solo se pueden entregar envios que estan en camino." },
      ENVIO_NO_PUEDE_VOLVER_A_PENDIENTE: { status: 409, message: "Un envio en camino no puede volver a pendiente." },
    };
    const response = knownResponses[error.message];
    if (response) {
      res.status(response.status).json({ error: response.message });
      return;
    }
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      res.status(409).json({ error: "Ya existe un registro con uno de los valores unicos indicados." });
      return;
    }
    if (error.code === "P2025") {
      res.status(404).json({ error: "El registro solicitado no existe." });
      return;
    }
  }

  console.error("Error en API de Logistica Fleet:", error);
  res.status(500).json({ error: "Error interno del servidor." });
};

app.use(errorHandler);

const server = app.listen(port, () => {
  console.log(`MVP Logistica Fleet escuchando en http://127.0.0.1:${port}`);
});

async function shutdown() {
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

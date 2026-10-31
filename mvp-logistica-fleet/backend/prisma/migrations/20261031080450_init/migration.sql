-- CreateTable
CREATE TABLE "Vehiculo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patente" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'DISPONIBLE',
    "kilometraje" INTEGER NOT NULL DEFAULT 0,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Conductor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dni" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "licencia" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Envio" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tracking_code" TEXT NOT NULL,
    "direccion_destino" TEXT NOT NULL,
    "estado_envio" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "vehiculoId" TEXT,
    "conductorId" TEXT,
    "fecha_creacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Envio_vehiculoId_fkey" FOREIGN KEY ("vehiculoId") REFERENCES "Vehiculo" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Envio_conductorId_fkey" FOREIGN KEY ("conductorId") REFERENCES "Conductor" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LogSshSync" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fecha_sincronizacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "servidor_destino" TEXT NOT NULL,
    "estado_transferencia" TEXT NOT NULL,
    "bytes_enviados" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Vehiculo_patente_key" ON "Vehiculo"("patente");

-- CreateIndex
CREATE UNIQUE INDEX "Conductor_dni_key" ON "Conductor"("dni");

-- CreateIndex
CREATE UNIQUE INDEX "Envio_tracking_code_key" ON "Envio"("tracking_code");

-- CreateIndex
CREATE INDEX "Envio_estado_envio_fecha_creacion_idx" ON "Envio"("estado_envio", "fecha_creacion");

-- CreateIndex
CREATE INDEX "Envio_vehiculoId_estado_envio_idx" ON "Envio"("vehiculoId", "estado_envio");

-- CreateIndex
CREATE INDEX "Envio_conductorId_estado_envio_idx" ON "Envio"("conductorId", "estado_envio");

package config

import (
	"context"
	"database/sql"
	"fmt"
	"os"
	"time"

	_ "github.com/lib/pq"
)

const schema = `
CREATE TABLE IF NOT EXISTS lote_agricola (
    id SERIAL PRIMARY KEY,
    codigo_lote VARCHAR(80) NOT NULL UNIQUE,
    cultivo VARCHAR(120) NOT NULL,
    hectareas DOUBLE PRECISION NOT NULL CHECK (hectareas > 0),
    estado_salud VARCHAR(20) NOT NULL DEFAULT 'OPTIMO'
        CHECK (estado_salud IN ('OPTIMO', 'ALERTA_HIDRICA', 'CRITICO'))
);

CREATE TABLE IF NOT EXISTS sensor_iot (
    id SERIAL PRIMARY KEY,
    lote_id INTEGER NOT NULL REFERENCES lote_agricola(id) ON DELETE CASCADE,
    tipo_sensor VARCHAR(32) NOT NULL
        CHECK (tipo_sensor IN ('HUMEDAD_SUELO', 'TEMPERATURA_AMBIENTE', 'NDVI_DRONE')),
    valor_lectura DOUBLE PRECISION NOT NULL,
    unidad VARCHAR(24) NOT NULL,
    fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vuelo_drone_log (
    id SERIAL PRIMARY KEY,
    lote_id INTEGER NOT NULL REFERENCES lote_agricola(id) ON DELETE CASCADE,
    operador VARCHAR(120) NOT NULL,
    duracion_min INTEGER NOT NULL CHECK (duracion_min > 0),
    cobertura_porcentaje DOUBLE PRECISION NOT NULL
        CHECK (cobertura_porcentaje >= 0 AND cobertura_porcentaje <= 100),
    timestamp_vuelo TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sensor_lote_fecha ON sensor_iot (lote_id, fecha_registro DESC);
CREATE INDEX IF NOT EXISTS idx_sensor_tipo_fecha ON sensor_iot (tipo_sensor, fecha_registro DESC);
CREATE INDEX IF NOT EXISTS idx_vuelo_lote_fecha ON vuelo_drone_log (lote_id, timestamp_vuelo DESC);
`

func OpenDatabase() (*sql.DB, error) {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "postgres://agrotech:agrotech_local@localhost:5432/agrotech_iot?sslmode=disable"
	}

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, fmt.Errorf("abrir pool PostgreSQL: %w", err)
	}
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(10)
	db.SetConnMaxLifetime(5 * time.Minute)
	db.SetConnMaxIdleTime(2 * time.Minute)

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := db.PingContext(ctx); err != nil {
		db.Close()
		return nil, fmt.Errorf("verificar PostgreSQL: %w", err)
	}
	if _, err := db.ExecContext(ctx, schema); err != nil {
		db.Close()
		return nil, fmt.Errorf("inicializar esquema AgroTech: %w", err)
	}
	return db, nil
}

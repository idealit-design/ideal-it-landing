package controllers

import (
	"database/sql"
	"errors"
	"math"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/lib/pq"

	"ideal-it/mvp-agrotech-iot/backend/models"
)

type ingestRequest struct {
	Lecturas []models.SensorReading `json:"lecturas"`
	Vuelos   []models.DroneFlight   `json:"vuelos"`
}

func IngestTelemetry(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var body ingestRequest
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Cuerpo JSON de telemetría inválido"})
			return
		}
		if len(body.Lecturas)+len(body.Vuelos) == 0 || len(body.Lecturas)+len(body.Vuelos) > 1000 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "El lote debe contener entre 1 y 1000 lecturas/vuelos"})
			return
		}
		for i := range body.Lecturas {
			reading := &body.Lecturas[i]
			reading.TipoSensor = strings.TrimSpace(reading.TipoSensor)
			reading.Unidad = strings.TrimSpace(reading.Unidad)
			if reading.LoteID < 1 || reading.Unidad == "" || !finite(reading.ValorLectura) {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Lectura inválida: lote_id, valor finito y unidad son requeridos"})
				return
			}
			switch reading.TipoSensor {
			case models.SensorHumedad:
				if reading.ValorLectura < 0 || reading.ValorLectura > 100 {
					c.JSON(http.StatusBadRequest, gin.H{"error": "La humedad de suelo debe estar entre 0 y 100"})
					return
				}
			case models.SensorTemperatura:
			case models.SensorNDVI:
				if reading.ValorLectura < -1 || reading.ValorLectura > 1 {
					c.JSON(http.StatusBadRequest, gin.H{"error": "NDVI debe estar entre -1 y 1"})
					return
				}
			default:
				c.JSON(http.StatusBadRequest, gin.H{"error": "tipo_sensor debe ser HUMEDAD_SUELO, TEMPERATURA_AMBIENTE o NDVI_DRONE"})
				return
			}
			if reading.FechaRegistro.IsZero() {
				reading.FechaRegistro = time.Now().UTC()
			}
		}
		for i := range body.Vuelos {
			flight := &body.Vuelos[i]
			flight.Operador = strings.TrimSpace(flight.Operador)
			if flight.LoteID < 1 || flight.Operador == "" || flight.DuracionMin <= 0 ||
				!finite(flight.CoberturaPorcentaje) || flight.CoberturaPorcentaje < 0 || flight.CoberturaPorcentaje > 100 {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Vuelo inválido: lote, operador, duración positiva y cobertura entre 0 y 100 son requeridos"})
				return
			}
			if flight.TimestampVuelo.IsZero() {
				flight.TimestampVuelo = time.Now().UTC()
			}
		}

		tx, err := db.BeginTx(c.Request.Context(), nil)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo iniciar la ingesta"})
			return
		}
		defer tx.Rollback()

		latestMoisture := make(map[int]models.SensorReading)
		for _, reading := range body.Lecturas {
			_, err := tx.ExecContext(c.Request.Context(), `
				INSERT INTO sensor_iot (lote_id, tipo_sensor, valor_lectura, unidad, fecha_registro)
				VALUES ($1, $2, $3, $4, $5)`,
				reading.LoteID, reading.TipoSensor, reading.ValorLectura, reading.Unidad, reading.FechaRegistro)
			if err != nil {
				writeIngestError(c, err)
				return
			}
			if reading.TipoSensor == models.SensorHumedad {
				current, ok := latestMoisture[reading.LoteID]
				if !ok || !reading.FechaRegistro.Before(current.FechaRegistro) {
					latestMoisture[reading.LoteID] = reading
				}
			}
		}
		for _, flight := range body.Vuelos {
			_, err := tx.ExecContext(c.Request.Context(), `
				INSERT INTO vuelo_drone_log (lote_id, operador, duracion_min, cobertura_porcentaje, timestamp_vuelo)
				VALUES ($1, $2, $3, $4, $5)`,
				flight.LoteID, flight.Operador, flight.DuracionMin, flight.CoberturaPorcentaje, flight.TimestampVuelo)
			if err != nil {
				writeIngestError(c, err)
				return
			}
		}
		for loteID, reading := range latestMoisture {
			_, err := tx.ExecContext(c.Request.Context(), `
				UPDATE lote_agricola
				SET estado_salud = CASE
					WHEN $1 <= 20 THEN 'CRITICO'
					WHEN $1 <= 35 THEN 'ALERTA_HIDRICA'
					ELSE 'OPTIMO'
				END
				WHERE id = $2 AND NOT EXISTS (
					SELECT 1 FROM sensor_iot newer
					WHERE newer.lote_id = $2 AND newer.tipo_sensor = 'HUMEDAD_SUELO'
					  AND (newer.fecha_registro > $3 OR (newer.fecha_registro = $3 AND newer.id > (
						SELECT MAX(id) FROM sensor_iot WHERE lote_id = $2 AND tipo_sensor = 'HUMEDAD_SUELO' AND fecha_registro = $3
					  )))
				)`, reading.ValorLectura, loteID, reading.FechaRegistro)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo actualizar el estado hídrico del lote"})
				return
			}
		}
		if err := tx.Commit(); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo confirmar la ingesta"})
			return
		}
		c.JSON(http.StatusCreated, gin.H{
			"lecturas_registradas": len(body.Lecturas),
			"vuelos_registrados":   len(body.Vuelos),
			"mensaje":              "Telemetría registrada",
		})
	}
}

func ListTelemetry(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		limit := 100
		if value := c.Query("limit"); value != "" {
			parsed, err := strconv.Atoi(value)
			if err != nil || parsed < 1 {
				c.JSON(http.StatusBadRequest, gin.H{"error": "limit debe ser un entero positivo"})
				return
			}
			limit = parsed
			if limit > 500 {
				limit = 500
			}
		}
		loteID := c.Query("lote_id")
		query := `SELECT id, lote_id, tipo_sensor, valor_lectura, unidad, fecha_registro
		          FROM sensor_iot`
		args := []any{}
		if loteID != "" {
			parsed, err := strconv.Atoi(loteID)
			if err != nil || parsed < 1 {
				c.JSON(http.StatusBadRequest, gin.H{"error": "lote_id inválido"})
				return
			}
			query += " WHERE lote_id = $1"
			args = append(args, parsed)
		}
		args = append(args, limit)
		query += " ORDER BY fecha_registro DESC, id DESC LIMIT $" + strconv.Itoa(len(args))
		rows, err := db.QueryContext(c.Request.Context(), query, args...)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo consultar la telemetría"})
			return
		}
		defer rows.Close()
		lecturas := make([]models.SensorReading, 0)
		for rows.Next() {
			var reading models.SensorReading
			if err := rows.Scan(&reading.ID, &reading.LoteID, &reading.TipoSensor, &reading.ValorLectura, &reading.Unidad, &reading.FechaRegistro); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo leer la telemetría"})
				return
			}
			lecturas = append(lecturas, reading)
		}
		if err := rows.Err(); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo leer la telemetría"})
			return
		}
		c.JSON(http.StatusOK, lecturas)
	}
}

func Dashboard(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		rows, err := db.QueryContext(c.Request.Context(), `
			SELECT l.id, l.codigo_lote, l.cultivo, l.hectareas, l.estado_salud,
			       (SELECT s.valor_lectura FROM sensor_iot s
			        WHERE s.lote_id = l.id AND s.tipo_sensor = 'HUMEDAD_SUELO'
			        ORDER BY s.fecha_registro DESC, s.id DESC LIMIT 1),
			       (SELECT COUNT(*) FROM vuelo_drone_log v WHERE v.lote_id = l.id)
			FROM lote_agricola l ORDER BY l.codigo_lote`)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo cargar el dashboard"})
			return
		}
		defer rows.Close()
		type dashboardLote struct {
			models.Lote
			VuelosRegistrados int `json:"vuelos_registrados"`
		}
		lotes := make([]dashboardLote, 0)
		totalHectareas := 0.0
		alertas := 0
		for rows.Next() {
			var item dashboardLote
			if err := rows.Scan(&item.ID, &item.CodigoLote, &item.Cultivo, &item.Hectareas, &item.EstadoSalud, &item.HumedadActual, &item.VuelosRegistrados); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo leer el dashboard"})
				return
			}
			totalHectareas += item.Hectareas
			if item.EstadoSalud != models.SaludOptimo {
				alertas++
			}
			lotes = append(lotes, item)
		}
		if err := rows.Err(); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo leer el dashboard"})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"lotes": lotes,
			"resumen": gin.H{
				"total_lotes":       len(lotes),
				"lotes_con_alerta":  alertas,
				"hectareas_totales": math.Round(totalHectareas*100) / 100,
			},
		})
	}
}

func writeIngestError(c *gin.Context, err error) {
	var pgErr *pq.Error
	if errors.As(err, &pgErr) && pgErr.Code == "23503" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "El lote indicado no existe"})
		return
	}
	c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo registrar la telemetría"})
}

func finite(value float64) bool {
	return !math.IsNaN(value) && !math.IsInf(value, 0)
}

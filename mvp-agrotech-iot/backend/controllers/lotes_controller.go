package controllers

import (
	"database/sql"
	"errors"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/lib/pq"

	"ideal-it/mvp-agrotech-iot/backend/models"
)

func ListLotes(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		rows, err := db.QueryContext(c.Request.Context(), `
			SELECT l.id, l.codigo_lote, l.cultivo, l.hectareas, l.estado_salud,
			       (SELECT s.valor_lectura FROM sensor_iot s
			        WHERE s.lote_id = l.id AND s.tipo_sensor = 'HUMEDAD_SUELO'
			        ORDER BY s.fecha_registro DESC, s.id DESC LIMIT 1)
			FROM lote_agricola l ORDER BY l.codigo_lote`)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudieron consultar los lotes"})
			return
		}
		defer rows.Close()

		lotes := make([]models.Lote, 0)
		for rows.Next() {
			var lote models.Lote
			if err := rows.Scan(&lote.ID, &lote.CodigoLote, &lote.Cultivo, &lote.Hectareas, &lote.EstadoSalud, &lote.HumedadActual); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudieron leer los lotes"})
				return
			}
			lotes = append(lotes, lote)
		}
		if err := rows.Err(); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudieron leer los lotes"})
			return
		}
		c.JSON(http.StatusOK, lotes)
	}
}

func CreateLote(db *sql.DB) gin.HandlerFunc {
	type input struct {
		CodigoLote string  `json:"codigo_lote" binding:"required"`
		Cultivo    string  `json:"cultivo" binding:"required"`
		Hectareas  float64 `json:"hectareas" binding:"required,gt=0"`
	}
	return func(c *gin.Context) {
		var body input
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "codigo_lote, cultivo y hectareas mayores a cero son requeridos"})
			return
		}
		body.CodigoLote = strings.TrimSpace(body.CodigoLote)
		body.Cultivo = strings.TrimSpace(body.Cultivo)
		if body.CodigoLote == "" || body.Cultivo == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "codigo_lote y cultivo no pueden estar vacíos"})
			return
		}
		var lote models.Lote
		err := db.QueryRowContext(c.Request.Context(), `
			INSERT INTO lote_agricola (codigo_lote, cultivo, hectareas)
			VALUES ($1, $2, $3)
			RETURNING id, codigo_lote, cultivo, hectareas, estado_salud`,
			body.CodigoLote, body.Cultivo, body.Hectareas,
		).Scan(&lote.ID, &lote.CodigoLote, &lote.Cultivo, &lote.Hectareas, &lote.EstadoSalud)
		if err != nil {
			var pgErr *pq.Error
			if errors.As(err, &pgErr) && pgErr.Code == "23505" {
				c.JSON(http.StatusConflict, gin.H{"error": "Ya existe un lote con ese código"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo crear el lote"})
			return
		}
		c.JSON(http.StatusCreated, lote)
	}
}

func UpdateLote(db *sql.DB) gin.HandlerFunc {
	type input struct {
		CodigoLote  string  `json:"codigo_lote" binding:"required"`
		Cultivo     string  `json:"cultivo" binding:"required"`
		Hectareas   float64 `json:"hectareas" binding:"required,gt=0"`
		EstadoSalud string  `json:"estado_salud" binding:"required,oneof=OPTIMO ALERTA_HIDRICA CRITICO"`
	}
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil || id < 1 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Identificador de lote inválido"})
			return
		}
		var body input
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Datos de lote inválidos"})
			return
		}
		body.CodigoLote = strings.TrimSpace(body.CodigoLote)
		body.Cultivo = strings.TrimSpace(body.Cultivo)
		if body.CodigoLote == "" || body.Cultivo == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "codigo_lote y cultivo no pueden estar vacíos"})
			return
		}
		var lote models.Lote
		err = db.QueryRowContext(c.Request.Context(), `
			UPDATE lote_agricola
			SET codigo_lote = $1, cultivo = $2, hectareas = $3, estado_salud = $4
			WHERE id = $5
			RETURNING id, codigo_lote, cultivo, hectareas, estado_salud`,
			body.CodigoLote, body.Cultivo, body.Hectareas, body.EstadoSalud, id,
		).Scan(&lote.ID, &lote.CodigoLote, &lote.Cultivo, &lote.Hectareas, &lote.EstadoSalud)
		if errors.Is(err, sql.ErrNoRows) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Lote no encontrado"})
			return
		}
		if err != nil {
			var pgErr *pq.Error
			if errors.As(err, &pgErr) && pgErr.Code == "23505" {
				c.JSON(http.StatusConflict, gin.H{"error": "Ya existe un lote con ese código"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo actualizar el lote"})
			return
		}
		c.JSON(http.StatusOK, lote)
	}
}

func DeleteLote(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil || id < 1 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Identificador de lote inválido"})
			return
		}
		result, err := db.ExecContext(c.Request.Context(), `DELETE FROM lote_agricola WHERE id = $1`, id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo eliminar el lote"})
			return
		}
		affected, err := result.RowsAffected()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo confirmar la eliminación"})
			return
		}
		if affected == 0 {
			c.JSON(http.StatusNotFound, gin.H{"error": "Lote no encontrado"})
			return
		}
		c.Status(http.StatusNoContent)
	}
}

package controllers

import (
	"database/sql"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"ideal-it/mvp-agrotech-iot/backend/services"
)

func ExportReport(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		format := strings.ToLower(c.DefaultQuery("format", "csv"))
		if format != "csv" && format != "pdf" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "format debe ser csv o pdf"})
			return
		}
		content, contentType, filename, err := services.ExportReport(db, format)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "No se pudo generar el reporte"})
			return
		}
		c.Header("Content-Disposition", `attachment; filename="`+filename+`"`)
		c.Data(http.StatusOK, contentType, content)
	}
}

package services

import (
	"bytes"
	"database/sql"
	"encoding/csv"
	"fmt"
	"strings"
	"time"

	"github.com/go-pdf/fpdf"
)

type ReportRow struct {
	Code          string
	Crop          string
	Hectares      float64
	Health        string
	LatestMoisture sql.NullFloat64
	Readings      int
	Flights       int
	AvgCoverage   sql.NullFloat64
}

func ExportReport(db *sql.DB, format string) ([]byte, string, string, error) {
	rows, err := db.Query(`
		SELECT l.codigo_lote, l.cultivo, l.hectareas, l.estado_salud,
		       (SELECT s.valor_lectura FROM sensor_iot s
		        WHERE s.lote_id = l.id AND s.tipo_sensor = 'HUMEDAD_SUELO'
		        ORDER BY s.fecha_registro DESC, s.id DESC LIMIT 1),
		       (SELECT COUNT(*) FROM sensor_iot s WHERE s.lote_id = l.id),
		       (SELECT COUNT(*) FROM vuelo_drone_log v WHERE v.lote_id = l.id),
		       (SELECT AVG(v.cobertura_porcentaje) FROM vuelo_drone_log v WHERE v.lote_id = l.id)
		FROM lote_agricola l ORDER BY l.codigo_lote`)
	if err != nil {
		return nil, "", "", fmt.Errorf("consultar datos del reporte: %w", err)
	}
	defer rows.Close()
	report := make([]ReportRow, 0)
	for rows.Next() {
		var item ReportRow
		if err := rows.Scan(&item.Code, &item.Crop, &item.Hectares, &item.Health, &item.LatestMoisture, &item.Readings, &item.Flights, &item.AvgCoverage); err != nil {
			return nil, "", "", fmt.Errorf("leer datos del reporte: %w", err)
		}
		report = append(report, item)
	}
	if err := rows.Err(); err != nil {
		return nil, "", "", fmt.Errorf("recorrer datos del reporte: %w", err)
	}

	switch strings.ToLower(format) {
	case "csv":
		content, err := buildCSV(report)
		return content, "text/csv; charset=utf-8", reportFilename("csv"), err
	case "pdf":
		content, err := buildPDF(report)
		return content, "application/pdf", reportFilename("pdf"), err
	default:
		return nil, "", "", fmt.Errorf("formato no soportado: %s", format)
	}
}

func buildCSV(report []ReportRow) ([]byte, error) {
	var buffer bytes.Buffer
	writer := csv.NewWriter(&buffer)
	if err := writer.Write([]string{"codigo_lote", "cultivo", "hectareas", "estado_salud", "humedad_actual_pct", "lecturas_sensor", "vuelos_drone", "cobertura_promedio_pct"}); err != nil {
		return nil, fmt.Errorf("escribir encabezado CSV: %w", err)
	}
	for _, row := range report {
		moisture := ""
		if row.LatestMoisture.Valid {
			moisture = fmt.Sprintf("%.2f", row.LatestMoisture.Float64)
		}
		coverage := ""
		if row.AvgCoverage.Valid {
			coverage = fmt.Sprintf("%.2f", row.AvgCoverage.Float64)
		}
		if err := writer.Write([]string{
			row.Code, row.Crop, fmt.Sprintf("%.2f", row.Hectares), row.Health,
			moisture, fmt.Sprint(row.Readings), fmt.Sprint(row.Flights), coverage,
		}); err != nil {
			return nil, fmt.Errorf("escribir fila CSV: %w", err)
		}
	}
	writer.Flush()
	if err := writer.Error(); err != nil {
		return nil, fmt.Errorf("finalizar CSV: %w", err)
	}
	return buffer.Bytes(), nil
}

func buildPDF(report []ReportRow) ([]byte, error) {
	pdf := fpdf.New("L", "mm", "A4", "")
	pdf.SetTitle("Reporte AgroTech - Auditoria agropecuaria", false)
	pdf.SetMargins(12, 12, 12)
	pdf.AddPage()
	pdf.SetFont("Arial", "B", 16)
	pdf.Cell(0, 10, "Reporte AgroTech - Auditoria agropecuaria")
	pdf.Ln(8)
	pdf.SetFont("Arial", "", 9)
	pdf.Cell(0, 7, "Generado: "+time.Now().UTC().Format("2006-01-02 15:04 UTC"))
	pdf.Ln(10)

	headers := []string{"Lote", "Cultivo", "Ha", "Salud", "Humedad %", "Lecturas", "Vuelos", "Cobertura %"}
	widths := []float64{34, 48, 22, 38, 28, 24, 20, 32}
	pdf.SetFont("Arial", "B", 9)
	for i, header := range headers {
		pdf.CellFormat(widths[i], 8, header, "1", 0, "C", false, 0, "")
	}
	pdf.Ln(-1)
	pdf.SetFont("Arial", "", 8)
	for _, row := range report {
		moisture, coverage := "Sin dato", "Sin dato"
		if row.LatestMoisture.Valid {
			moisture = fmt.Sprintf("%.1f", row.LatestMoisture.Float64)
		}
		if row.AvgCoverage.Valid {
			coverage = fmt.Sprintf("%.1f", row.AvgCoverage.Float64)
		}
		values := []string{
			row.Code, row.Crop, fmt.Sprintf("%.2f", row.Hectares), row.Health,
			moisture, fmt.Sprint(row.Readings), fmt.Sprint(row.Flights), coverage,
		}
		for i, value := range values {
			pdf.CellFormat(widths[i], 7, value, "1", 0, "L", false, 0, "")
		}
		pdf.Ln(-1)
	}
	var buffer bytes.Buffer
	if err := pdf.Output(&buffer); err != nil {
		return nil, fmt.Errorf("generar PDF: %w", err)
	}
	return buffer.Bytes(), nil
}

func reportFilename(extension string) string {
	return "agrotech-auditoria-" + time.Now().UTC().Format("20060102-150405") + "." + extension
}

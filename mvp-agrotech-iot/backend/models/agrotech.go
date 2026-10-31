package models

import "time"

const (
	SaludOptimo       = "OPTIMO"
	SaludAlertaHidrica = "ALERTA_HIDRICA"
	SaludCritico      = "CRITICO"

	SensorHumedad      = "HUMEDAD_SUELO"
	SensorTemperatura  = "TEMPERATURA_AMBIENTE"
	SensorNDVI         = "NDVI_DRONE"
)

type Lote struct {
	ID             int      `json:"id"`
	CodigoLote     string   `json:"codigo_lote"`
	Cultivo        string   `json:"cultivo"`
	Hectareas      float64  `json:"hectareas"`
	EstadoSalud    string   `json:"estado_salud"`
	HumedadActual  *float64 `json:"humedad_actual"`
}

type SensorReading struct {
	ID            int       `json:"id"`
	LoteID        int       `json:"lote_id" binding:"required"`
	TipoSensor    string    `json:"tipo_sensor" binding:"required"`
	ValorLectura  float64   `json:"valor_lectura"`
	Unidad        string    `json:"unidad" binding:"required"`
	FechaRegistro time.Time `json:"fecha_registro"`
}

type DroneFlight struct {
	ID                   int       `json:"id"`
	LoteID               int       `json:"lote_id" binding:"required"`
	Operador             string    `json:"operador" binding:"required"`
	DuracionMin          int       `json:"duracion_min"`
	CoberturaPorcentaje  float64   `json:"cobertura_porcentaje"`
	TimestampVuelo       time.Time `json:"timestamp_vuelo"`
}

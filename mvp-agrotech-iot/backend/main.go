package main

import (
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"

	"ideal-it/mvp-agrotech-iot/backend/config"
	"ideal-it/mvp-agrotech-iot/backend/controllers"
)

func main() {
	if mode := os.Getenv("GIN_MODE"); mode != "" {
		gin.SetMode(mode)
	}
	db, err := config.OpenDatabase()
	if err != nil {
		log.Fatalf("conectar PostgreSQL: %v", err)
	}
	defer db.Close()

	router := gin.New()
	router.Use(gin.Logger(), gin.Recovery(), corsMiddleware())

	router.GET("/health", func(c *gin.Context) {
		if err := db.PingContext(c.Request.Context()); err != nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{"status": "degraded", "database": "unavailable"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"status": "ok", "version": "0.1.1"})
	})

	api := router.Group("/api")
	api.GET("/lotes", controllers.ListLotes(db))
	api.POST("/lotes", controllers.CreateLote(db))
	api.PUT("/lotes/:id", controllers.UpdateLote(db))
	api.DELETE("/lotes/:id", controllers.DeleteLote(db))
	api.GET("/telemetry", controllers.ListTelemetry(db))
	api.POST("/telemetry/ingest", controllers.IngestTelemetry(db))
	api.GET("/dashboard", controllers.Dashboard(db))
	api.GET("/reports/export", controllers.ExportReport(db))

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("iniciar servidor HTTP: %v", err)
	}
}

func corsMiddleware() gin.HandlerFunc {
	allowedOrigin := os.Getenv("CORS_ORIGIN")
	allowedOrigins := map[string]bool{
		"http://localhost:5173":   true,
		"http://127.0.0.1:5173": true,
	}
	if allowedOrigin != "" {
		allowedOrigins = map[string]bool{allowedOrigin: true}
	}
	return func(c *gin.Context) {
		origin := c.GetHeader("Origin")
		if allowedOrigins[origin] {
			c.Header("Access-Control-Allow-Origin", origin)
			c.Header("Vary", "Origin")
			c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")
		}
		if c.Request.Method == http.MethodOptions {
			if origin != "" && !allowedOrigins[origin] {
				c.AbortWithStatus(http.StatusForbidden)
				return
			}
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	}
}

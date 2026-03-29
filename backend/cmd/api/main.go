package main

import (
	"backend-api/database"
	"backend-api/internal/appconfig"
	handler "backend-api/internal/handlers"
	"context"
	"errors"
	"log"
	"net/http"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	envConfig := appconfig.LoadEnv()
	fileConfig, err := appconfig.LoadFile(envConfig.AppConfigPath)
	if err != nil {
		log.Fatal(err)
	}

	log.Printf("Config loaded from %s", envConfig.AppConfigPath)
	log.Printf("Env file path: %s", envConfig.EnvFile)
	log.Printf("Container timezone: %s", envConfig.TZ)

	repo, err := database.NewRepository(envConfig.ConnectionString())
	if err != nil {
		log.Fatalf("Cannot connect to database: %v", err)
	}

	log.Println("Database connection established")

	handler := handler.NewHandler(repo)

	r := gin.Default()

	database.Init()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     fileConfig.CORS.AllowOrigins,
		AllowMethods:     fileConfig.CORS.AllowMethods,
		AllowHeaders:     fileConfig.CORS.AllowHeaders,
		ExposeHeaders:    fileConfig.CORS.ExposeHeaders,
		AllowCredentials: fileConfig.CORS.AllowCredentials,
		MaxAge:           time.Duration(fileConfig.CORS.MaxAgeHours) * time.Hour,
	}))

	api := r.Group("/api")
	{
		api.POST("/register", handler.Register)
		api.POST("/login", handler.LoginFirst)
		api.POST("/profile", handler.Profile)
		api.POST("/childusers", handler.LoadChildUsers)
		api.POST("/newchilduser", handler.CreateChildUser)
		api.POST("/changepassword", handler.ChangePassword)
		api.POST("/logout", handler.Logout)
		api.POST("/orders", handler.Orders)
		api.POST("/loginwithrefr", handler.LoginWithRefreshToken)
		api.POST("/neworder", handler.NewOrder)
		api.POST("/userservices", handler.LoadServices)
		api.POST("/newservice", handler.NewService)
		api.POST("/updateservice", handler.UpdateService)
		api.POST("/newworker", handler.NewWorker)
		api.POST("/updateworker", handler.UpdateWorker)
		api.POST("/printworkerservices", handler.PrintWorkerServices)
		api.POST("/updateorder", handler.UpdateOrder)
		api.POST("/servicesinorder", handler.ServicesInOrder)
		api.POST("/addservicesinorderload", handler.AddServicesInOrderLoad)
		api.POST("/addservice", handler.AddService)
		api.POST("/completeorderservice", handler.CompleteOrderService)
		api.POST("/undoorderservice", handler.UndoOrderService)
		api.POST("/loadworkers", handler.LoadWorkers)
		api.POST("/loadworkerservices", handler.LoadWorkerServices)
		api.POST("/stats", handler.Stats)
	}

	server := &http.Server{
		Addr:         ":" + envConfig.ServerPort,
		Handler:      r,
		ReadTimeout:  time.Duration(fileConfig.Server.ReadTimeoutSeconds) * time.Second,
		WriteTimeout: time.Duration(fileConfig.Server.WriteTimeoutSeconds) * time.Second,
		IdleTimeout:  time.Duration(fileConfig.Server.IdleTimeoutSeconds) * time.Second,
	}

	shutdownCtx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	go func() {
		<-shutdownCtx.Done()
		log.Println("Shutdown signal received, stopping server")

		ctx, cancel := context.WithTimeout(
			context.Background(),
			time.Duration(fileConfig.Server.ShutdownTimeoutSeconds)*time.Second,
		)
		defer cancel()

		if err := server.Shutdown(ctx); err != nil {
			log.Printf("Graceful shutdown error: %v", err)
		}

		if err := repo.Close(); err != nil {
			log.Printf("Database close error: %v", err)
		}

		log.Println("Server stopped")
	}()

	log.Printf("Server started on :%s", envConfig.ServerPort)

	if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		log.Fatalf("HTTP server start error: %v", err)
	}
}

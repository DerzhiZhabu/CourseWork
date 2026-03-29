package appconfig

import (
	"bufio"
	"encoding/json"
	"fmt"
	"os"
	"strings"
)

type EnvConfig struct {
	TZ            string
	EnvFile       string
	AppConfigPath string
	ServerPort    string
	DBHost        string
	DBPort        string
	DBUser        string
	DBPassword    string
	DBName        string
	DBSSLMode     string
}

type FileConfig struct {
	Server ServerConfig `json:"server"`
	CORS   CORSConfig   `json:"cors"`
}

type ServerConfig struct {
	ReadTimeoutSeconds     int `json:"readTimeoutSeconds"`
	WriteTimeoutSeconds    int `json:"writeTimeoutSeconds"`
	IdleTimeoutSeconds     int `json:"idleTimeoutSeconds"`
	ShutdownTimeoutSeconds int `json:"shutdownTimeoutSeconds"`
}

type CORSConfig struct {
	AllowOrigins     []string `json:"allowOrigins"`
	AllowMethods     []string `json:"allowMethods"`
	AllowHeaders     []string `json:"allowHeaders"`
	ExposeHeaders    []string `json:"exposeHeaders"`
	AllowCredentials bool     `json:"allowCredentials"`
	MaxAgeHours      int      `json:"maxAgeHours"`
}

func LoadEnv() EnvConfig {
	envFile := getenv("ENV_FILE", ".env")
	loadDotEnv(envFile)

	return EnvConfig{
		TZ:            getenv("TZ", "Asia/Novosibirsk"),
		EnvFile:       envFile,
		AppConfigPath: getenv("APP_CONFIG_PATH", "/app/config/app-config.json"),
		ServerPort:    getenv("SERVER_PORT", "8080"),
		DBHost:        getenv("DB_HOST", "postgres"),
		DBPort:        getenv("DB_PORT", "5432"),
		DBUser:        getenv("DB_USER", "postgres"),
		DBPassword:    getenv("DB_PASSWORD", "postgres"),
		DBName:        getenv("DB_NAME", "mydb"),
		DBSSLMode:     getenv("DB_SSLMODE", "disable"),
	}
}

func (c EnvConfig) ConnectionString() string {
	return fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		c.DBHost,
		c.DBPort,
		c.DBUser,
		c.DBPassword,
		c.DBName,
		c.DBSSLMode,
	)
}

func LoadFile(path string) (FileConfig, error) {
	file, err := os.Open(path)
	if err != nil {
		return FileConfig{}, fmt.Errorf("failed to open config %q: %w", path, err)
	}
	defer file.Close()

	var cfg FileConfig
	decoder := json.NewDecoder(file)
	decoder.DisallowUnknownFields()

	if err := decoder.Decode(&cfg); err != nil {
		return FileConfig{}, fmt.Errorf("failed to decode config %q: %w", path, err)
	}

	applyDefaults(&cfg)

	return cfg, nil
}

func applyDefaults(cfg *FileConfig) {
	if cfg.Server.ReadTimeoutSeconds <= 0 {
		cfg.Server.ReadTimeoutSeconds = 15
	}

	if cfg.Server.WriteTimeoutSeconds <= 0 {
		cfg.Server.WriteTimeoutSeconds = 15
	}

	if cfg.Server.IdleTimeoutSeconds <= 0 {
		cfg.Server.IdleTimeoutSeconds = 60
	}

	if cfg.Server.ShutdownTimeoutSeconds <= 0 {
		cfg.Server.ShutdownTimeoutSeconds = 10
	}

	if len(cfg.CORS.AllowMethods) == 0 {
		cfg.CORS.AllowMethods = []string{"GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"}
	}

	if len(cfg.CORS.AllowHeaders) == 0 {
		cfg.CORS.AllowHeaders = []string{"Origin", "Content-Length", "Content-Type", "Authorization", "Accept"}
	}

	if len(cfg.CORS.ExposeHeaders) == 0 {
		cfg.CORS.ExposeHeaders = []string{"Content-Length"}
	}

	if cfg.CORS.MaxAgeHours <= 0 {
		cfg.CORS.MaxAgeHours = 12
	}
}

func getenv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}

	return fallback
}

func loadDotEnv(path string) {
	file, err := os.Open(path)
	if err != nil {
		return
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}

		if strings.HasPrefix(line, "export ") {
			line = strings.TrimSpace(strings.TrimPrefix(line, "export "))
		}

		key, value, ok := strings.Cut(line, "=")
		if !ok {
			continue
		}

		key = strings.TrimSpace(key)
		value = strings.TrimSpace(value)
		value = strings.Trim(value, `"'`)

		if key == "" {
			continue
		}

		if _, exists := os.LookupEnv(key); exists {
			continue
		}

		_ = os.Setenv(key, value)
	}
}

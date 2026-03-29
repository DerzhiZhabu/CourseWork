package database

import (
	"database/sql"
	"fmt"

	_ "github.com/lib/pq"
)

type Repository struct {
	database *sql.DB
}

func NewRepository(connStr string) (*Repository, error) {
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		return nil, fmt.Errorf("database connection failed: %w", err)
	}

	if err = db.Ping(); err != nil {
		return nil, fmt.Errorf("database ping failed: %w", err)
	}

	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)

	return &Repository{database: db}, nil
}

func (r *Repository) Close() error {
	if r == nil || r.database == nil {
		return nil
	}

	return r.database.Close()
}

package handler


import (
	"backend-api/database"
)

type Handler struct {
    repo   *database.Repository
}

func NewHandler(repo *database.Repository) *Handler {
    return &Handler{
        repo:   repo,
    }
}
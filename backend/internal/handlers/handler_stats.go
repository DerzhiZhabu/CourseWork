package handler

import (
	"backend-api/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

func (h *Handler) Stats(c *gin.Context) {
	var req models.StatsRecieve

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Неверные данные: " + err.Error(),
		})
		return
	}

	result, err := h.repo.LoadStats(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Ошибка при получении статистики: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Статистика получена успешно",
		"user":    result,
	})
}

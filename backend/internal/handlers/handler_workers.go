package handler

import (
	"backend-api/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

func (h *Handler) NewWorker(c *gin.Context) {
	var req models.NewWorkerRecieve

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Неверные данные: " + err.Error(),
		})
		return
	}

	result, err := h.repo.CreateNewWorker(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Ошибка при создании работника" + err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Работник создан успешно",
		"user": gin.H{
			"result": result,
		},
	})
}

func (h *Handler) UpdateWorker(c *gin.Context) {
	var req models.UpdateWorkerRecieve

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Неверные данные: " + err.Error(),
		})
		return
	}

	result, err := h.repo.UpdateWorker(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Ошибка при обновлении работника" + err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Работник обновлен успешно",
		"user": gin.H{
			"result": result,
		},
	})
}

func (h *Handler) LoadWorkers(c *gin.Context) {
	var req models.LoadWorkersRecieve

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Неверные данные: " + err.Error(),
		})
		return
	}

	workers, err := h.repo.LoadWorkers(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Ошибка при получении работников" + err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Работники получены успешно",
		"user": gin.H{
			"result": workers,
		},
	})
}

func (h *Handler) LoadWorkerServices(c *gin.Context) {
	var req models.LoadWorkerServicesRecieve

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Неверные данные: " + err.Error(),
		})
		return
	}

	workers, total, err := h.repo.LoadWorkerServices(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Ошибка при получении работников" + err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Работники получены успешно",
		"user": gin.H{
			"result": workers,
			"total":  total,
		},
	})
}

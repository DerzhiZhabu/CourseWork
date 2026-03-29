package handler

import (
	"backend-api/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

func (h *Handler) LoadServices(c *gin.Context) {
	var req models.ServicesRecieve

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Неверные данные: " + err.Error(),
		})
		return
	}

	services, err := h.repo.LoadServices(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Ошибка при получении услуг" + err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Услуги получены успешно",
		"user": gin.H{
			"services": services,
		},
	})
}

func (h *Handler) NewService(c *gin.Context) {
	var req models.NewServiceRecieve

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Неверные данные: " + err.Error(),
		})
		return
	}

	result, err := h.repo.CreateNewService(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Ошибка при создании услуги" + err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Услуга создана успешно",
		"user": gin.H{
			"result": result,
		},
	})
}

func (h *Handler) UpdateService(c *gin.Context) {
	var req models.UpdateServiceRecieve

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Неверные данные: " + err.Error(),
		})
		return
	}

	result, err := h.repo.UpdateService(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Ошибка при обновлении услуги" + err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Услуга обновлена успешно",
		"user": gin.H{
			"result": result,
		},
	})
}

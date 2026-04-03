package handler

import (
	"backend-api/models"
	"net/http"

	"github.com/gin-gonic/gin"
)

func (h *Handler) Orders(c *gin.Context) {
	var req models.OrdersRecieve

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Неверные данные: " + err.Error(),
		})
		return
	}

	orders, total, page, size, err := h.repo.GetOrders(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Ошибка при получении заказов" + err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Заказы получены успешно",
		"user": gin.H{
			"orders": orders,
			"total":  total,
			"page":   page,
			"size":   size,
		},
	})
}

func (h *Handler) UpdateOrder(c *gin.Context) {
	var req models.UpdateOrderRecieve

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Неверные данные: " + err.Error(),
		})
		return
	}

	result, err := h.repo.UpdateOrder(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Ошибка при обновлении заказа" + err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Заказ успешно обновлён",
		"user": gin.H{
			"result": result,
		},
	})
}

func (h *Handler) NewOrder(c *gin.Context) {
	var req models.NewOrderRecieve

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Неверные данные: " + err.Error(),
		})
		return
	}

	result, err := h.repo.CreateNewOrder(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Ошибка при создании заказа" + err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Заказ создан успешно",
		"user": gin.H{
			"result": result,
		},
	})
}

func (h *Handler) AddService(c *gin.Context) {
	var req models.AddServiceRecieve

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Неверные данные: " + err.Error(),
		})
		return
	}

	result, err := h.repo.AddService(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Ошибка при добавлении услуги" + err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Услуга успешно добавлена",
		"user": gin.H{
			"result": result,
		},
	})
}

func (h *Handler) CompleteOrderService(c *gin.Context) {
	var req models.CompleteOrderServiceRecieve

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Неверные данные: " + err.Error(),
		})
		return
	}

	result, err := h.repo.CompleteOrderService(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Ошибка при завершении услуги" + err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Услуга отмечена как выполненная",
		"user": gin.H{
			"result": result,
		},
	})
}

func (h *Handler) UndoOrderService(c *gin.Context) {
	var req models.UndoOrderServiceRecieve

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Неверные данные: " + err.Error(),
		})
		return
	}

	result, err := h.repo.UndoOrderService(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Ошибка при возврате статуса услуги" + err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Услуга успешно возвращена в статус не готова",
		"user": gin.H{
			"result": result,
		},
	})
}

func (h *Handler) DeleteOrderService(c *gin.Context) {
	var req models.DeleteOrderServiceRecieve

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Неверные данные: " + err.Error(),
		})
		return
	}

	result, err := h.repo.DeleteOrderService(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Ошибка при удалении услуги из заказа" + err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Услуга успешно удалена из заказа",
		"user": gin.H{
			"result": result,
		},
	})
}

func (h *Handler) ServicesInOrder(c *gin.Context) {
	var req models.ServicesInOrderRecieve

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Неверные данные: " + err.Error(),
		})
		return
	}

	result, err := h.repo.LoadOrderServices(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Ошибка при получении услуг из заказа" + err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Услуги из заказа успешно получены",
		"user": gin.H{
			"services": result,
		},
	})
}

func (h *Handler) AddServicesInOrderLoad(c *gin.Context) {
	var req models.AddServicesLoaderRecieve

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Неверные данные: " + err.Error(),
		})
		return
	}

	result, err := h.repo.AddServicesInOrderLoad(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Ошибка при получении услуг" + err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Ошибка при получении услуг",
		"user": gin.H{
			"services": result,
		},
	})
}

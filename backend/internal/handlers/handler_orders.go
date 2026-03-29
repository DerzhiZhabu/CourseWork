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

	result, err := h.repo.СreateNewOrder(req)
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
			"error": "РќРµРІРµСЂРЅС‹Рµ РґР°РЅРЅС‹Рµ: " + err.Error(),
		})
		return
	}

	result, err := h.repo.CompleteOrderService(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "РћС€РёР±РєР° РїСЂРё Р·Р°РІРµСЂС€РµРЅРёРё СѓСЃР»СѓРіРё" + err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "РЈСЃР»СѓРіР° РѕС‚РјРµС‡РµРЅР° РєР°Рє РІС‹РїРѕР»РЅРµРЅРЅР°СЏ",
		"user": gin.H{
			"result": result,
		},
	})
}

func (h *Handler) UndoOrderService(c *gin.Context) {
	var req models.UndoOrderServiceRecieve

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "РќРµРІРµСЂРЅС‹Рµ РґР°РЅРЅС‹Рµ: " + err.Error(),
		})
		return
	}

	result, err := h.repo.UndoOrderService(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "РћС€РёР±РєР° РїСЂРё РІРѕР·РІСЂР°С‚Рµ СЃС‚Р°С‚СѓСЃР° СѓСЃР»СѓРіРё" + err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "РЈСЃР»СѓРіР° СѓСЃРїРµС€РЅРѕ РІРѕР·РІСЂР°С‰РµРЅР° РІ СЃС‚Р°С‚СѓСЃ РЅРµ РіРѕС‚РѕРІР°",
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

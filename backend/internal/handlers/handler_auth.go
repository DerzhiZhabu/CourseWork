package handler

import (
	"net/http"
	"strings"
	"unicode/utf8"

	"backend-api/database"
	tokens "backend-api/jwt"
	"backend-api/models"

	"github.com/gin-gonic/gin"
)

const maxAuthFieldLength = 30

func exceedsTrimmedAuthLength(value string) bool {
	return utf8.RuneCountInString(strings.TrimSpace(value)) > maxAuthFieldLength
}

func exceedsAuthLength(value string) bool {
	return utf8.RuneCountInString(value) > maxAuthFieldLength
}

func (h *Handler) Register(c *gin.Context) {
	var req models.RegisterRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Неверные данные: " + err.Error(),
		})
		return
	}

	if exceedsTrimmedAuthLength(req.Login) {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Логин должен содержать не более 30 символов",
		})
		return
	}

	if exceedsAuthLength(req.Password) {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Пароль должен содержать не более 30 символов",
		})
		return
	}

	user, err := h.repo.CreatePrimeUser(req)
	if err != nil {
		switch err {
		case database.ErrLoginExists:
			c.JSON(http.StatusConflict, gin.H{
				"error": "Этот login уже зарегистрирован: " + err.Error(),
			})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Ошибка при регистрации: " + err.Error(),
			})
		}
		return
	}

	accesToken, refreshToken, refreshTokenID, err := tokens.GenerateTokenPair(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Не удалось сгенерировать токены: " + err.Error(),
		})
		return
	}

	err = h.repo.StoreRefreshToken(user.ID, refreshToken, refreshTokenID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Не удалось записать токен: " + err.Error(),
		})
		return
	}

	c.SetCookie("refresh_token", refreshToken, 7*24*60*60, "/", "", true, true)

	c.JSON(http.StatusCreated, gin.H{
		"message": "Регистрация прошла успешно",
		"user": gin.H{
			"acces_token": accesToken,
		},
	})
}

func (h *Handler) LoginWithRefreshToken(c *gin.Context) {
	refreshToken, err := tokens.CheckRefreshToken(c)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Некорректный токен: " + err.Error(),
		})
		return
	}

	refrClaims, err := tokens.ValidateRefreshToken(refreshToken)
	if err != nil {
		c.SetCookie("refresh_token", "", -1, "/", "", true, true)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Некорректный токен: " + err.Error(),
		})
		return
	}

	err = h.repo.CheckRefreshStores(refreshToken, refrClaims.UserID, refrClaims.TokenID)
	if err != nil {
		c.SetCookie("refresh_token", "", -1, "/", "", true, true)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Некорректный токен: " + err.Error(),
		})
		return
	}

	accesToken, err := tokens.GenerateAccessToken(refrClaims.UserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Не удалось сгенерировать токен: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Авторизация прошла успешно",
		"user": gin.H{
			"accesToken": accesToken,
		},
	})
}

func (h *Handler) LoginFirst(c *gin.Context) {
	var req models.LoginRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Неверные данные: " + err.Error(),
		})
		return
	}

	if exceedsTrimmedAuthLength(req.Login) {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Логин должен содержать не более 30 символов",
		})
		return
	}

	if exceedsAuthLength(req.Password) {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Пароль должен содержать не более 30 символов",
		})
		return
	}

	user, err := h.repo.LoginUser(req)
	if err != nil {
		switch err {
		case database.ErrLoginExists:
			c.JSON(http.StatusConflict, gin.H{
				"error": "Этот login уже занят",
			})
		case database.ErrUserNotFound, database.ErrPasswordInvalid, database.ErrLogin:
			c.JSON(http.StatusConflict, gin.H{
				"error": "Неверно введен логин или пароль.",
			})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Ошибка при авторизации",
			})
		}
		return
	}

	accesToken, refreshToken, refreshTokenID, err := tokens.GenerateTokenPair(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Не удалось сгенерировать токены: " + err.Error(),
		})
		return
	}

	err = h.repo.StoreRefreshToken(user.ID, refreshToken, refreshTokenID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Не удалось записать токен: " + err.Error(),
		})
		return
	}

	c.SetCookie("refresh_token", refreshToken, 7*24*60*60, "/", "", true, true)

	c.JSON(http.StatusCreated, gin.H{
		"message": "Авторизация прошла успешно",
		"user": gin.H{
			"accesToken": accesToken,
		},
	})
}

func (h *Handler) Logout(c *gin.Context) {
	refreshToken, err := tokens.CheckRefreshToken(c)
	if err == nil {
		_ = h.repo.DeleteRefreshToken(refreshToken)
	}

	c.SetCookie("refresh_token", "", -1, "/", "", true, true)

	c.JSON(http.StatusOK, gin.H{
		"message": "Выход выполнен успешно",
	})
}

func (h *Handler) Profile(c *gin.Context) {
	var req models.ProfileRecieve

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Неверные данные: " + err.Error(),
		})
		return
	}

	user, err := h.repo.GetProfile(req.AccessToken)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Ошибка при получении профиля: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Профиль получен успешно",
		"user": gin.H{
			"login": user.Login,
			"acces": user.Acces,
		},
	})
}

func (h *Handler) LoadChildUsers(c *gin.Context) {
	var req models.ChildUsersRecieve

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Неверные данные: " + err.Error(),
		})
		return
	}

	users, err := h.repo.LoadChildUsers(req.AccessToken)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Ошибка при получении пользователей: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Пользователи получены успешно",
		"user": gin.H{
			"result": users,
		},
	})
}

func (h *Handler) CreateChildUser(c *gin.Context) {
	var req models.NewChildUserRecieve

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Неверные данные: " + err.Error(),
		})
		return
	}

	if exceedsTrimmedAuthLength(req.Login) {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Логин должен содержать не более 30 символов",
		})
		return
	}

	if exceedsAuthLength(req.Password) {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Пароль должен содержать не более 30 символов",
		})
		return
	}

	if utf8.RuneCountInString(req.Password) < 6 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Пароль должен быть не короче 6 символов",
		})
		return
	}

	user, err := h.repo.CreateChildUser(req)
	if err != nil {
		status := http.StatusInternalServerError

		switch err {
		case database.ErrLoginExists:
			status = http.StatusConflict
		case database.ErrAccessDenied, database.ErrInvalidAccess:
			status = http.StatusBadRequest
		}

		c.JSON(status, gin.H{
			"error": "Ошибка при создании пользователя: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Пользователь создан успешно",
		"user": gin.H{
			"id":    user.ID,
			"login": user.Login,
			"acces": user.Acces,
		},
	})
}

func (h *Handler) ChangePassword(c *gin.Context) {
	var req models.ChangePasswordRecieve

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Неверные данные: " + err.Error(),
		})
		return
	}

	if exceedsAuthLength(req.OldPassword) {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Пароль должен содержать не более 30 символов",
		})
		return
	}

	if exceedsAuthLength(req.NewPassword) {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Новый пароль должен содержать не более 30 символов",
		})
		return
	}

	if utf8.RuneCountInString(req.NewPassword) < 6 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Новый пароль должен быть не короче 6 символов",
		})
		return
	}

	err := h.repo.ChangePassword(req)
	if err != nil {
		status := http.StatusInternalServerError
		if err == database.ErrOldPasswordInvalid {
			status = http.StatusBadRequest
		}

		c.JSON(status, gin.H{
			"error": "Ошибка при смене пароля: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Пароль изменён успешно",
	})
}

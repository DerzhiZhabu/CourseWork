package tokens

import(
    "github.com/gin-gonic/gin"
)

func CheckRefreshToken(c *gin.Context) (string, error) {

    refreshToken, err := c.Cookie("refresh_token")
    if err != nil{
		return "", err
	}

	return refreshToken, nil
}
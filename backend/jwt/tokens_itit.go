package tokens

import (
	"errors"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

const (
	accessSecretEnvName  = "JWT_ACCESS_SECRET"
	refreshSecretEnvName = "JWT_REFRESH_SECRET"

	defaultAccessTokenSecret  = "change-me-access-secret-key-for-coursework-32-bytes-min"
	defaultRefreshTokenSecret = "change-me-refresh-secret-key-for-coursework-32-bytes-min"
)

type AccessTokenClaims struct {
	UserID int64
	jwt.RegisteredClaims
}

type RefreshTokenClaims struct {
	UserID  int64
	TokenID string
	jwt.RegisteredClaims
}

func GenerateTokenPair(userID int64) (accessToken string, refreshToken string, refreshTokenID string, err error) {
	accessTokenSecret, err := getAccessTokenSecret()
	if err != nil {
		return "", "", "", err
	}

	refreshTokenSecret, err := getRefreshTokenSecret()
	if err != nil {
		return "", "", "", err
	}

	var accessTokenID string
	refreshTokenID = generateTokenID()
	accessTokenID = generateTokenID()

	accessClaims := AccessTokenClaims{
		UserID: userID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(15 * time.Minute)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "backend",
			Subject:   fmt.Sprintf("%d", userID),
			ID:        accessTokenID,
		},
	}

	accessJwt := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims)
	accessToken, err = accessJwt.SignedString(accessTokenSecret)
	if err != nil {
		return "", "", "", fmt.Errorf("failed to sign access token: %w", err)
	}

	refreshClaims := RefreshTokenClaims{
		UserID: userID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			ID:        refreshTokenID,
		},
		TokenID: refreshTokenID,
	}

	refreshJwt := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
	refreshToken, err = refreshJwt.SignedString(refreshTokenSecret)
	if err != nil {
		return "", "", "", fmt.Errorf("failed to sign refresh token: %w", err)
	}

	return accessToken, refreshToken, refreshTokenID, nil
}

func GenerateAccessToken(userID int64) (accessToken string, err error) {
	accessTokenSecret, err := getAccessTokenSecret()
	if err != nil {
		return "", err
	}

	accessTokenID := generateTokenID()

	accessClaims := AccessTokenClaims{
		UserID: userID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(15 * time.Minute)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "backend",
			Subject:   fmt.Sprintf("%d", userID),
			ID:        accessTokenID,
		},
	}

	accessJwt := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims)
	accessToken, err = accessJwt.SignedString(accessTokenSecret)
	if err != nil {
		return "", fmt.Errorf("failed to sign access token: %w", err)
	}

	return accessToken, nil
}

func ValidateAccessToken(tokenString string) (*AccessTokenClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &AccessTokenClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}

		return getAccessTokenSecret()
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*AccessTokenClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, errors.New("invalid token")
}

func ValidateRefreshToken(tokenString string) (*RefreshTokenClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &RefreshTokenClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}

		return getRefreshTokenSecret()
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*RefreshTokenClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, errors.New("invalid refresh token")
}

func generateTokenID() string {
	return fmt.Sprintf("id-%d", time.Now().UnixNano())
}

func getAccessTokenSecret() ([]byte, error) {
	return getSecretFromEnv(accessSecretEnvName, defaultAccessTokenSecret)
}

func getRefreshTokenSecret() ([]byte, error) {
	return getSecretFromEnv(refreshSecretEnvName, defaultRefreshTokenSecret)
}

func getSecretFromEnv(envName, fallback string) ([]byte, error) {
	secret := strings.TrimSpace(os.Getenv(envName))
	if secret == "" {
		secret = fallback
	}

	if len(secret) < 32 {
		return nil, fmt.Errorf("%s must contain at least 32 characters", envName)
	}

	return []byte(secret), nil
}

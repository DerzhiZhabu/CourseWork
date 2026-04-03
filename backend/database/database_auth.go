package database

import (
	"database/sql"
	"errors"
	"log"

	tokens "backend-api/jwt"
	"backend-api/models"

	"golang.org/x/crypto/bcrypt"
)

var (
	ErrUserNotFound       = errors.New("пользователь не найден")
	ErrLoginExists        = errors.New("login занят")
	ErrLogin              = errors.New("login или пароль указаны не верно")
	ErrPasswordInvalid    = errors.New("пароль введен неверно")
	ErrRefresh            = errors.New("RefreshToken был удален")
	ErrRefreshNotMatched  = errors.New("RefreshToken был подделан")
	ErrOldPasswordInvalid = errors.New("старый пароль указан неверно")
	ErrAccessDenied       = errors.New("недостаточно прав доступа")
	ErrInvalidAccess      = errors.New("некорректный уровень доступа")
)

var ErrDeleteCurrentUser = errors.New("cannot delete current account")

func (r *Repository) CreatePrimeUser(req models.RegisterRequest) (*models.User, error) {
	var exists bool
	err := r.database.QueryRow("SELECT EXISTS(SELECT 1 FROM users WHERE login = $1)", req.Login).Scan(&exists)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, ErrLoginExists
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	var primeUser models.PrimeUser
	err = r.database.QueryRow(`
		INSERT INTO prime_users
		DEFAULT VALUES
		RETURNING id
	`).Scan(&primeUser.ID)
	if err != nil {
		return nil, err
	}

	var user models.User
	err = r.database.QueryRow(`
		INSERT INTO users (prime_id, login, password, acces)
		VALUES ($1, $2, $3, $4)
		RETURNING id, prime_id, login, acces
	`, primeUser.ID, req.Login, string(hashedPassword), "main").Scan(
		&user.ID,
		&user.Prime_id,
		&user.Login,
		&user.Acces,
	)
	if err != nil {
		return nil, err
	}

	return &user, nil
}

func (r *Repository) StoreRefreshToken(userID int64, refreshToken string, refreshTokenID string) error {
	hashedToken, err := tokens.HashTokenWithPreHashSHA256(refreshToken)
	if err != nil {
		return err
	}

	_, err = r.database.Exec(`
		INSERT INTO refresh_token (token, user_id, token_id)
		VALUES ($1, $2, $3)
	`, hashedToken, userID, refreshTokenID)
	if err != nil {
		return err
	}

	return nil
}

func (r *Repository) CheckRefreshStores(refreshToken string, userID int64, tokenID string) error {
	var exists bool
	var storedToken string

	log.Printf("CheckRefreshStores called - userID: %d, tokenID: %s", userID, tokenID)

	err := r.database.QueryRow(
		"SELECT token FROM refresh_token WHERE user_id = $1 AND token_id = $2;",
		userID,
		tokenID,
	).Scan(&storedToken)
	if err == sql.ErrNoRows {
		return ErrRefresh
	}
	if err != nil {
		return err
	}

	exists, err = tokens.VerifyTokenWithPreHashSHA256(refreshToken, storedToken)
	if err != nil {
		return err
	}
	if !exists {
		return ErrRefreshNotMatched
	}

	return nil
}

func (r *Repository) DeleteRefreshToken(refreshToken string) error {
	hashedToken, err := tokens.HashTokenWithPreHashSHA256(refreshToken)
	if err != nil {
		return err
	}

	_, err = r.database.Exec("DELETE FROM refresh_token WHERE token = $1", hashedToken)
	if err != nil {
		return err
	}

	return nil
}

func (r *Repository) LoginUser(req models.LoginRequest) (*models.User, error) {
	var exists bool

	err := r.database.QueryRow("SELECT NOT EXISTS(SELECT 1 FROM users WHERE login = $1)", req.Login).Scan(&exists)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, ErrUserNotFound
	}

	var user models.User
	err = r.database.QueryRow("SELECT id, login, password FROM users WHERE login = $1;", req.Login).Scan(
		&user.ID,
		&user.Login,
		&user.Password,
	)
	if err != nil {
		return nil, err
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password))
	if err != nil {
		return nil, ErrPasswordInvalid
	}

	return &user, nil
}

func (r *Repository) GetProfile(accessToken string) (*models.User, error) {
	claims, err := tokens.ValidateAccessToken(accessToken)
	if err != nil {
		return nil, err
	}

	var user models.User
	err = r.database.QueryRow(
		"SELECT id, prime_id, login, acces FROM users WHERE id = $1;",
		claims.UserID,
	).Scan(
		&user.ID,
		&user.Prime_id,
		&user.Login,
		&user.Acces,
	)
	if err != nil {
		return nil, err
	}

	return &user, nil
}

func (r *Repository) ChangePassword(req models.ChangePasswordRecieve) error {
	claims, err := tokens.ValidateAccessToken(req.AccessToken)
	if err != nil {
		return err
	}

	var currentPassword string
	err = r.database.QueryRow("SELECT password FROM users WHERE id = $1;", claims.UserID).Scan(&currentPassword)
	if err != nil {
		return err
	}

	err = bcrypt.CompareHashAndPassword([]byte(currentPassword), []byte(req.OldPassword))
	if err != nil {
		return ErrOldPasswordInvalid
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	_, err = r.database.Exec("UPDATE users SET password = $1 WHERE id = $2;", string(hashedPassword), claims.UserID)
	if err != nil {
		return err
	}

	return nil
}

func (r *Repository) LoadChildUsers(accessToken string) ([]models.ChildUser, error) {
	user, err := r.GetProfile(accessToken)
	if err != nil {
		return nil, err
	}

	rows, err := r.database.Query(`
		SELECT id, login, acces
		FROM users
		WHERE prime_id = $1 AND id <> $2
		ORDER BY
			CASE acces
				WHEN 'manage' THEN 1
				WHEN 'base' THEN 2
				WHEN 'main' THEN 3
				ELSE 4
			END,
			login ASC
	`, user.Prime_id, user.ID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := make([]models.ChildUser, 0)
	for rows.Next() {
		var child models.ChildUser
		if err := rows.Scan(&child.ID, &child.Login, &child.Acces); err != nil {
			return nil, err
		}
		result = append(result, child)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return result, nil
}

func (r *Repository) CreateChildUser(req models.NewChildUserRecieve) (*models.ChildUser, error) {
	currentUser, err := r.GetProfile(req.AccessToken)
	if err != nil {
		return nil, err
	}

	if currentUser.Acces != "main" {
		return nil, ErrAccessDenied
	}

	if req.Acces != "manage" && req.Acces != "base" {
		return nil, ErrInvalidAccess
	}

	var exists bool
	err = r.database.QueryRow("SELECT EXISTS(SELECT 1 FROM users WHERE login = $1)", req.Login).Scan(&exists)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, ErrLoginExists
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	var child models.ChildUser
	err = r.database.QueryRow(`
		INSERT INTO users (prime_id, login, password, acces)
		VALUES ($1, $2, $3, $4)
		RETURNING id, login, acces
	`, currentUser.Prime_id, req.Login, string(hashedPassword), req.Acces).Scan(
		&child.ID,
		&child.Login,
		&child.Acces,
	)
	if err != nil {
		return nil, err
	}

	return &child, nil
}

func (r *Repository) DeleteChildUser(req models.DeleteChildUserRecieve) error {
	currentUser, err := r.GetProfile(req.AccessToken)
	if err != nil {
		return err
	}

	if currentUser.Acces != "main" {
		return ErrAccessDenied
	}

	if currentUser.ID == req.ID {
		return ErrDeleteCurrentUser
	}

	var targetAcces string
	err = r.database.QueryRow(`
		SELECT acces
		FROM users
		WHERE id = $1 AND prime_id = $2
	`, req.ID, currentUser.Prime_id).Scan(&targetAcces)
	if err == sql.ErrNoRows {
		return ErrUserNotFound
	}
	if err != nil {
		return err
	}

	if targetAcces == "main" {
		return ErrAccessDenied
	}

	if _, err = r.database.Exec("DELETE FROM refresh_token WHERE user_id = $1", req.ID); err != nil {
		return err
	}

	result, err := r.database.Exec(`
		DELETE FROM users
		WHERE id = $1 AND prime_id = $2
	`, req.ID, currentUser.Prime_id)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		return ErrUserNotFound
	}

	return nil
}

package database

import (
	"fmt"

	tokens "backend-api/jwt"
	"backend-api/models"
)

func (r *Repository) CreateNewService(req models.NewServiceRecieve) (string, error) {
	claims, err := tokens.ValidateAccessToken(req.AccessToken)
	if err != nil {
		return "", err
	}
	userID := claims.UserID

	var prime_id int64

	query := `
        SELECT p.id
		FROM prime_users p
		JOIN users u ON u.prime_id = p.id
		WHERE u.id = $1;
    `

	err = r.database.QueryRow(query, userID).Scan(&prime_id)
	if err != nil {
		return "", fmt.Errorf("query failed: %w", err)
	}

	query = `
        INSERT INTO services (prime_id, name, price, price2)
        VALUES ($1, $2, $3, $4) 
    `

	_, err = r.database.Exec(query,
		prime_id,
		req.Name,
		req.Price1,
		req.Price2)

	if err != nil {
		return "", fmt.Errorf("query failed: %w", err)
	}

	return "Success", nil
}

func (r *Repository) UpdateService(req models.UpdateServiceRecieve) (string, error) {
	claims, err := tokens.ValidateAccessToken(req.AccessToken)
	if err != nil {
		return "", err
	}
	userID := claims.UserID

	var primeID int64

	query := `
        SELECT p.id
		FROM prime_users p
		JOIN users u ON u.prime_id = p.id
		WHERE u.id = $1;
    `

	err = r.database.QueryRow(query, userID).Scan(&primeID)
	if err != nil {
		return "", fmt.Errorf("query failed: %w", err)
	}

	query = `
        UPDATE services
		SET name = $1,
			price = $2,
			price2 = $3
		WHERE prime_id = $4
		AND id = $5
    `

	_, err = r.database.Exec(query,
		req.Name,
		req.Price1,
		req.Price2,
		primeID,
		req.ID)

	if err != nil {
		return "", fmt.Errorf("query failed: %w", err)
	}

	return "Success", nil
}

func (r *Repository) LoadServices(req models.ServicesRecieve) (*[]models.Services, error) {
	claims, err := tokens.ValidateAccessToken(req.AccessToken)
	if err != nil {
		return nil, err
	}
	userID := claims.UserID

	query := `
        SELECT s.*
		FROM services s
		JOIN users u ON u.prime_id = s.prime_id
		WHERE u.id = $1;
    `

	rows, err := r.database.Query(query, userID)
	if err != nil {
		return nil, fmt.Errorf("query failed: %w", err)
	}
	defer rows.Close()

	var services []models.Services

	for rows.Next() {
		var service models.Services
		err := rows.Scan(
			&service.ID,
			&service.Prime_id,
			&service.Name,
			&service.Price,
			&service.Price2)
		if err != nil {
			return nil, fmt.Errorf("scan failed: %w", err)
		}
		services = append(services, service)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("rows iteration error: %w", err)
	}

	if services == nil {
		services = []models.Services{}
	}

	return &services, nil
}

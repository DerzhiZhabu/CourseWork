package database

import (
	"fmt"

	tokens "backend-api/jwt"
	"backend-api/models"
)

func (r *Repository) CreateNewWorker(req models.NewWorkerRecieve) (string, error) {

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
        INSERT INTO workers (prime_id, last_name, first_name, patronymic, procent, sost)
        VALUES ($1, $2, $3, $4, $5, $6)
    `

	_, err = r.database.Exec(query,
		prime_id,
		req.Surname,
		req.Name,
		req.Patronimic,
		req.Procent,
		req.Sost)

	if err != nil {
		return "", fmt.Errorf("query failed: %w", err)
	}

	return "Success", nil
}

func (r *Repository) UpdateWorker(req models.UpdateWorkerRecieve) (string, error) {

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
        UPDATE workers
		SET last_name = $1,
			first_name = $2,
			patronymic = $3,
			sost = $4
		WHERE prime_id = $5
		AND id = $6
    `

	_, err = r.database.Exec(query,
		req.Surname,
		req.Name,
		req.Patronimic,
		req.Sost,
		prime_id,
		req.ID)

	if err != nil {
		return "", fmt.Errorf("query failed: %w", err)
	}

	return "Success", nil
}

func (r *Repository) LoadWorkers(req models.LoadWorkersRecieve) (*[]models.Worker, error) {

	claims, err := tokens.ValidateAccessToken(req.AccessToken)
	if err != nil {
		return nil, err
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
		return nil, fmt.Errorf("query failed: %w", err)
	}

	query = `
        SELECT 
			w.id,
			w.last_name,
			w.first_name,
			w.patronymic,
			w.procent,
			w.sost
		FROM workers w
		JOIN users u ON u.prime_id = w.prime_id
		WHERE u.id = $1;
    `

	rows, err := r.database.Query(query, userID)
	if err != nil {
		return nil, fmt.Errorf("query failed: %w", err)
	}
	defer rows.Close()

	var workers []models.Worker

	for rows.Next() {
		var worker models.Worker
		err := rows.Scan(
			&worker.ID,
			&worker.Surname,
			&worker.Name,
			&worker.Patronimic,
			&worker.Procent,
			&worker.Status)
		if err != nil {
			return nil, fmt.Errorf("scan failed: %w", err)
		}
		workers = append(workers, worker)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("rows iteration error: %w", err)
	}

	if workers == nil {
		workers = []models.Worker{}
	}

	return &workers, nil
}

func (r *Repository) GetWorkerByID(accessToken string, workerID int64) (*models.Worker, error) {
	claims, err := tokens.ValidateAccessToken(accessToken)
	if err != nil {
		return nil, err
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
		return nil, fmt.Errorf("query failed: %w", err)
	}

	query = `
        SELECT 
			w.id,
			w.last_name,
			w.first_name,
			w.patronymic,
			w.procent,
			w.sost
		FROM workers w
		WHERE w.prime_id = $1
		AND w.id = $2;
    `

	var worker models.Worker
	err = r.database.QueryRow(query, primeID, workerID).Scan(
		&worker.ID,
		&worker.Surname,
		&worker.Name,
		&worker.Patronimic,
		&worker.Procent,
		&worker.Status,
	)
	if err != nil {
		return nil, fmt.Errorf("scan failed: %w", err)
	}

	return &worker, nil
}

func (r *Repository) LoadWorkerServices(req models.LoadWorkerServicesRecieve) (*[]models.LoadWorkerServicesSend, float64, error) {

	claims, err := tokens.ValidateAccessToken(req.AccessToken)
	if err != nil {
		return nil, 0, err
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
		return nil, 0, fmt.Errorf("query failed: %w", err)
	}

	var total float64 = 0

	query = `
        SELECT 
			o.number,
			s.name,
			((os.price * os.col) * (w.procent / 100.0))
		FROM orders_services os
		JOIN services s ON s.id = os.service_id
		JOIN orders o ON o.id = os.order_id
		JOIN workers w ON w.id = os.worker_id
		WHERE 
			os.worker_id = $1
			AND o.prime_id = $2
			AND o.date_closed IS NOT NULL
			AND o.date_closed BETWEEN $3 AND $4
		ORDER BY o.number DESC;
    `

	rows, err := r.database.Query(query, req.WorkerId, prime_id, req.DateStart, req.DateEnd)
	if err != nil {
		return nil, 0, fmt.Errorf("query failed: %w", err)
	}
	defer rows.Close()

	var services []models.LoadWorkerServicesSend

	for rows.Next() {
		var service models.LoadWorkerServicesSend
		err := rows.Scan(
			&service.Number,
			&service.Sname,
			&service.Summary)
		if err != nil {
			return nil, 0, fmt.Errorf("scan failed: %w", err)
		}
		total = total + service.Summary
		services = append(services, service)
	}

	if err = rows.Err(); err != nil {
		return nil, 0, fmt.Errorf("rows iteration error: %w", err)
	}

	if services == nil {
		services = []models.LoadWorkerServicesSend{}
	}

	return &services, total, nil
}

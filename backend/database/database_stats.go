package database

import (
	"fmt"

	tokens "backend-api/jwt"
	"backend-api/models"
)

func (r *Repository) LoadStats(req models.StatsRecieve) (*models.StatsSend, error) {
	claims, err := tokens.ValidateAccessToken(req.AccessToken)
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

	stats := &models.StatsSend{
		SalaryRows:  []models.StatsSalaryRowSend{},
		ServiceRows: []models.StatsServiceRowSend{},
	}

	query = `
        SELECT
			w.id,
			w.first_name,
			w.last_name,
			w.patronymic,
			w.procent,
			w.sost,
			COALESCE(SUM((os.price * os.col) * (w.procent / 100.0)), 0)
		FROM orders_services os
		JOIN orders o ON o.id = os.order_id
		JOIN workers w ON w.id = os.worker_id
		WHERE
			o.prime_id = $1
			AND o.date_closed IS NOT NULL
			AND o.date_closed BETWEEN $2 AND $3
		GROUP BY
			w.id,
			w.first_name,
			w.last_name,
			w.patronymic,
			w.procent,
			w.sost
		HAVING COALESCE(SUM((os.price * os.col) * (w.procent / 100.0)), 0) > 0
		ORDER BY
			COALESCE(SUM((os.price * os.col) * (w.procent / 100.0)), 0) DESC,
			w.last_name,
			w.first_name,
			w.patronymic;
    `

	rows, err := r.database.Query(query, primeID, req.DateStart, req.DateEnd)
	if err != nil {
		return nil, fmt.Errorf("salary stats query failed: %w", err)
	}

	for rows.Next() {
		var row models.StatsSalaryRowSend

		err = rows.Scan(
			&row.ID,
			&row.Name,
			&row.Surname,
			&row.Patronimic,
			&row.Procent,
			&row.Status,
			&row.Salary,
		)
		if err != nil {
			return nil, fmt.Errorf("salary stats scan failed: %w", err)
		}

		stats.SalaryTotal += row.Salary
		stats.SalaryRows = append(stats.SalaryRows, row)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("salary stats rows iteration error: %w", err)
	}

	if len(stats.SalaryRows) > 0 {
		stats.SalaryAverage = stats.SalaryTotal / float64(len(stats.SalaryRows))
	}

	rows.Close()

	query = `
        SELECT
			s.id,
			s.name,
			COALESCE(SUM(os.price * os.col), 0)
		FROM orders_services os
		JOIN orders o ON o.id = os.order_id
		JOIN services s ON s.id = os.service_id
		WHERE
			o.prime_id = $1
			AND o.date_closed IS NOT NULL
			AND o.date_closed BETWEEN $2 AND $3
		GROUP BY s.id, s.name
		HAVING COALESCE(SUM(os.price * os.col), 0) > 0
		ORDER BY
			COALESCE(SUM(os.price * os.col), 0) DESC,
			s.name;
    `

	rows, err = r.database.Query(query, primeID, req.DateStart, req.DateEnd)
	if err != nil {
		return nil, fmt.Errorf("service stats query failed: %w", err)
	}

	for rows.Next() {
		var row models.StatsServiceRowSend

		err = rows.Scan(
			&row.ID,
			&row.Name,
			&row.Income,
		)
		if err != nil {
			return nil, fmt.Errorf("service stats scan failed: %w", err)
		}

		stats.ServicesTotal += row.Income
		stats.ServiceRows = append(stats.ServiceRows, row)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("service stats rows iteration error: %w", err)
	}

	rows.Close()

	query = `
        SELECT COALESCE(SUM(o.price), 0)
		FROM orders o
		WHERE
			o.prime_id = $1
			AND o.date_closed IS NOT NULL
			AND o.date_closed BETWEEN $2 AND $3;
    `

	err = r.database.QueryRow(query, primeID, req.DateStart, req.DateEnd).Scan(&stats.RevenueTotal)
	if err != nil {
		return nil, fmt.Errorf("revenue stats query failed: %w", err)
	}

	stats.NetProfit = stats.RevenueTotal - stats.SalaryTotal

	return stats, nil
}

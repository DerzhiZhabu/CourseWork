package database

import (
	"fmt"
	"log"

	tokens "backend-api/jwt"
	"backend-api/models"
)

var statusMapping = map[string]string{
	"new":       "Новый",
	"wait":      "Ждёт запчастей",
	"work":      "В работе",
	"comp":      "Готов",
	"can":       "Отменен",
	"cl":        "Закрыт",
	"delivered": "Доставлен",
	"compw":     "Ждёт подтверждения",
}

var reverseStatusMapping map[string]string

func Init() {
	reverseStatusMapping = make(map[string]string)
	for en, ru := range statusMapping {
		reverseStatusMapping[ru] = en
	}
	reverseStatusMapping["Ждет подтверждения"] = "compw"
	reverseStatusMapping["Готов, ожидает подтверждения"] = "compw"
}

func isOrderLockedForEditing(status string) bool {
	return status == "comp" || status == "cl"
}

func isCompletedOrderStatus(status string) bool {
	return status == "comp" || status == "compw" || status == "cl"
}

func (r *Repository) getUserAcces(userID int64) (string, error) {
	var acces string

	err := r.database.QueryRow(
		"SELECT acces FROM users WHERE id = $1",
		userID,
	).Scan(&acces)
	if err != nil {
		return "", fmt.Errorf("user access query failed: %w", err)
	}

	return acces, nil
}

func (r *Repository) CreateNewOrder(req models.NewOrderRecieve) (string, error) {

	claims, err := tokens.ValidateAccessToken(req.AccessToken)
	if err != nil {
		return "", err
	}
	userID := claims.UserID
	var number int64
	var prime_id int64

	query := `
        SELECT p.orders_count, p.id
		FROM prime_users p
		JOIN users u ON u.prime_id = p.id
		WHERE u.id = $1;
    `

	err = r.database.QueryRow(query, userID).Scan(&number, &prime_id)
	if err != nil {
		return "", fmt.Errorf("query failed: %w", err)
	}

	number += 1

	query = `
        INSERT INTO orders (prime_id, number, name, client, sost, phone, type)
        VALUES ($1, $2, $3, $4, $5, $6, $7) 
    `

	_, err = r.database.Exec(query,
		prime_id,
		number,
		req.Name,
		req.Client,
		"new",
		req.Phone,
		req.Type)

	if err != nil {
		return "", fmt.Errorf("query failed: %w", err)
	}

	query = `
        UPDATE prime_users SET orders_count = $1 WHERE id = $2
    `
	_, err = r.database.Exec(query,
		number,
		prime_id)

	if err != nil {
		return "", fmt.Errorf("query failed: %w", err)
	}

	return "Success", nil
}

func (r *Repository) AddService(req models.AddServiceRecieve) (string, error) {

	claims, err := tokens.ValidateAccessToken(req.AccessToken)
	if err != nil {
		return "", err
	}
	userID := claims.UserID
	var number int64 = req.Number
	var prime_id int64
	var order_id int64
	var orderStatus string

	query := `
        SELECT o.id, o.prime_id, o.sost
			FROM orders o
			JOIN users u ON u.id = $2
			WHERE o.number = $1
			AND u.id = $2;
    `

	err = r.database.QueryRow(query, number, userID).Scan(&order_id, &prime_id, &orderStatus)
	if err != nil {
		return "", fmt.Errorf("query failed: %w", err)
	}

	if isOrderLockedForEditing(orderStatus) {
		return "", fmt.Errorf("locked orders cannot be edited")
	}

	query = `
        SELECT EXISTS (
            SELECT 1 
            FROM orders_services 
            WHERE prime_id = $1 
              AND order_id = $2 
              AND service_id = $3
        )
    `

	var exists bool
	err = r.database.QueryRow(query, prime_id, order_id, req.ID).Scan(&exists)

	if err != nil {
		return "", fmt.Errorf("failed to check existence: %w", err)
	}

	if exists {
		query = `
        	UPDATE orders_services
			SET 
				price = $4,
				col = $5
			WHERE prime_id = $1 
			AND order_id = $2 
			AND service_id = $3;
    	`
		_, err = r.database.Exec(query,
			prime_id,
			order_id,
			req.ID,
			req.Price,
			req.Col)

		if err != nil {
			return "", fmt.Errorf("query failed: %w", err)
		}

		return "Success", nil
	}

	query = `
        INSERT INTO orders_services (prime_id, order_id, service_id, price, col)
		VALUES ($1, $2, $3, $4, $5);
    `

	_, err = r.database.Exec(query,
		prime_id,
		order_id,
		req.ID,
		req.Price,
		req.Col)

	if err != nil {
		return "", fmt.Errorf("query failed: %w", err)
	}

	return "Success", nil
}

func (r *Repository) CompleteOrderService(req models.CompleteOrderServiceRecieve) (string, error) {

	claims, err := tokens.ValidateAccessToken(req.AccessToken)
	if err != nil {
		return "", err
	}
	userID := claims.UserID

	var primeID int64
	var orderStatus string

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
        SELECT o.sost
		FROM orders_services os
		INNER JOIN orders o ON o.id = os.order_id
		WHERE os.id = $1
		AND os.prime_id = $2
    `

	err = r.database.QueryRow(query, req.OSID, primeID).Scan(&orderStatus)
	if err != nil {
		return "", fmt.Errorf("order status query failed: %w", err)
	}

	if isOrderLockedForEditing(orderStatus) {
		return "", fmt.Errorf("locked orders cannot be edited")
	}

	query = `
        UPDATE orders_services os
		SET worker_id = $1,
			sost = 1
		FROM workers w
		WHERE os.id = $2
		AND os.prime_id = $3
		AND w.id = $1
		AND w.prime_id = $3
		AND w.sost = true
    `

	result, err := r.database.Exec(query, req.WorkerID, req.OSID, primeID)
	if err != nil {
		return "", fmt.Errorf("query failed: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return "", fmt.Errorf("rows affected failed: %w", err)
	}

	if rowsAffected == 0 {
		return "", fmt.Errorf("service completion failed")
	}

	return "Success", nil
}

func (r *Repository) UndoOrderService(req models.UndoOrderServiceRecieve) (string, error) {

	claims, err := tokens.ValidateAccessToken(req.AccessToken)
	if err != nil {
		return "", err
	}
	userID := claims.UserID

	var primeID int64
	var currentUserAcces string
	var orderStatus string

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
        SELECT o.sost
		FROM orders_services os
		INNER JOIN orders o ON o.id = os.order_id
		WHERE os.id = $1
		AND os.prime_id = $2
    `

	err = r.database.QueryRow(query, req.OSID, primeID).Scan(&orderStatus)
	if err != nil {
		return "", fmt.Errorf("order status query failed: %w", err)
	}

	currentUserAcces, err = r.getUserAcces(userID)
	if err != nil {
		return "", err
	}

	if isOrderLockedForEditing(orderStatus) {
		return "", fmt.Errorf("locked orders cannot be edited")
	}

	if currentUserAcces == "base" {
		return "", fmt.Errorf("base users cannot return service to work")
	}

	query = `
        UPDATE orders_services
		SET worker_id = NULL,
			sost = 0
		WHERE id = $1
		AND prime_id = $2
    `

	result, err := r.database.Exec(query, req.OSID, primeID)
	if err != nil {
		return "", fmt.Errorf("query failed: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return "", fmt.Errorf("rows affected failed: %w", err)
	}

	if rowsAffected == 0 {
		return "", fmt.Errorf("service rollback failed")
	}

	return "Success", nil
}

func (r *Repository) DeleteOrderService(req models.DeleteOrderServiceRecieve) (string, error) {

	claims, err := tokens.ValidateAccessToken(req.AccessToken)
	if err != nil {
		return "", err
	}
	userID := claims.UserID

	var primeID int64
	var currentUserAcces string
	var orderStatus string
	var serviceStatus int64

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
        SELECT o.sost, os.sost
		FROM orders_services os
		INNER JOIN orders o ON o.id = os.order_id
		WHERE os.id = $1
		AND os.prime_id = $2
    `

	err = r.database.QueryRow(query, req.OSID, primeID).Scan(&orderStatus, &serviceStatus)
	if err != nil {
		return "", fmt.Errorf("order service query failed: %w", err)
	}

	currentUserAcces, err = r.getUserAcces(userID)
	if err != nil {
		return "", err
	}

	if isOrderLockedForEditing(orderStatus) {
		return "", fmt.Errorf("locked orders cannot be edited")
	}

	if currentUserAcces == "base" {
		return "", fmt.Errorf("base users cannot delete services from order")
	}

	if serviceStatus == 1 {
		return "", fmt.Errorf("completed services cannot be deleted")
	}

	result, err := r.database.Exec(`
        DELETE FROM orders_services
		WHERE id = $1
		AND prime_id = $2
    `, req.OSID, primeID)
	if err != nil {
		return "", fmt.Errorf("query failed: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return "", fmt.Errorf("rows affected failed: %w", err)
	}

	if rowsAffected == 0 {
		return "", fmt.Errorf("service delete failed")
	}

	return "Success", nil
}

func (r *Repository) UpdateOrder(req models.UpdateOrderRecieve) (string, error) {

	claims, err := tokens.ValidateAccessToken(req.AccessToken)
	if err != nil {
		return "", err
	}
	userID := claims.UserID
	var prime_id int64
	var currentStatus string
	var currentUserAcces string
	var totalServices int64
	var completedServices int64

	req.Sost = reverseStatusMapping[req.Sost]
	if req.Sost == "" {
		return "", fmt.Errorf("invalid order status")
	}

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
        SELECT sost
		FROM orders
		WHERE prime_id = $1 AND number = $2
    `

	err = r.database.QueryRow(query, prime_id, req.Number).Scan(&currentStatus)
	if err != nil {
		return "", fmt.Errorf("order status query failed: %w", err)
	}

	currentUserAcces, err = r.getUserAcces(userID)
	if err != nil {
		return "", err
	}

	if currentStatus == "cl" {
		return "", fmt.Errorf("closed orders cannot be edited")
	}

	if currentStatus == "comp" && currentUserAcces == "base" {
		return "", fmt.Errorf("base users cannot edit ready orders")
	}

	if currentUserAcces == "base" && (req.Sost == "comp" || req.Sost == "cl") {
		return "", fmt.Errorf("base users cannot set order status to ready or closed")
	}

	if currentStatus == "comp" {
		if req.Sost == "comp" {
			return "Success", nil
		}

		if req.Sost != "cl" {
			return "", fmt.Errorf("ready orders can only be closed")
		}
	}

	query = `
        SELECT
			COUNT(*),
			COALESCE(SUM(CASE WHEN os.sost = 1 THEN 1 ELSE 0 END), 0)
		FROM orders_services os
		INNER JOIN orders o ON o.id = os.order_id
		WHERE os.prime_id = $1 AND o.number = $2
    `

	err = r.database.QueryRow(query, prime_id, req.Number).Scan(&totalServices, &completedServices)
	if err != nil {
		return "", fmt.Errorf("order services query failed: %w", err)
	}

	if req.Sost != currentStatus {
		switch req.Sost {
		case "comp":
			if totalServices == 0 || totalServices != completedServices {
				return "", fmt.Errorf("order can be marked ready only after all services are completed")
			}
		case "compw":
			if totalServices == 0 || totalServices != completedServices {
				return "", fmt.Errorf("order can wait for confirmation only after all services are completed")
			}
		case "cl":
			if totalServices == 0 || totalServices != completedServices {
				return "", fmt.Errorf("order can be closed only after all services are completed")
			}
		}
	}

	if currentStatus == "comp" && req.Sost == "cl" {
		query = `
        UPDATE orders 
		SET sost = $1
		WHERE prime_id = $2 AND number = $3
    `

		_, err = r.database.Exec(query,
			req.Sost,
			prime_id,
			req.Number)
	} else if req.Sost == "cl" {
		query = `
        UPDATE orders 
		SET name = $1, 
			client = $2, 
			sost = $3, 
			phone = $4, 
			type = $5,
			date_closed = COALESCE(date_closed, CURRENT_DATE)
		WHERE prime_id = $6 AND number = $7
    `

		_, err = r.database.Exec(query,
			req.Name,
			req.Client,
			req.Sost,
			req.Phone,
			req.Type,
			prime_id,
			req.Number)
	} else if req.Sost == "comp" {
		query = `
        UPDATE orders 
		SET name = $1, 
			client = $2, 
			sost = $3, 
			phone = $4, 
			type = $5,
			date_closed = COALESCE(date_closed, CURRENT_DATE)
		WHERE prime_id = $6 AND number = $7
    `

		_, err = r.database.Exec(query,
			req.Name,
			req.Client,
			req.Sost,
			req.Phone,
			req.Type,
			prime_id,
			req.Number)
	} else if req.Sost == "compw" {
		query = `
        UPDATE orders 
		SET name = $1, 
			client = $2, 
			sost = $3, 
			phone = $4, 
			type = $5
		WHERE prime_id = $6 AND number = $7
    `

		_, err = r.database.Exec(query,
			req.Name,
			req.Client,
			req.Sost,
			req.Phone,
			req.Type,
			prime_id,
			req.Number)
	} else {
		query = `
        UPDATE orders 
		SET name = $1, 
			client = $2, 
			sost = $3, 
			phone = $4, 
			type = $5,
			date_closed = NULL
		WHERE prime_id = $6 AND number = $7
    `

		_, err = r.database.Exec(query,
			req.Name,
			req.Client,
			req.Sost,
			req.Phone,
			req.Type,
			prime_id,
			req.Number)
	}

	if err != nil {
		return "", fmt.Errorf("query failed: %w", err)
	}

	return "Success", nil
}

func (r *Repository) LoadOrderServices(req models.ServicesInOrderRecieve) ([]models.ServicesInOrder, error) {

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
		os.id,
		os.service_id,
		s.name,
		os.col,
		os.price,
		os.sost,
		COALESCE(
			CONCAT_WS(' ', w.last_name, w.first_name, w.patronymic), 
			'Пусто'
		) AS worker_name
		FROM orders_services os
		INNER JOIN orders o ON os.order_id = o.id
		LEFT JOIN services s ON os.service_id = s.id
		LEFT JOIN workers w ON os.worker_id = w.id
		WHERE os.prime_id = $1 AND o.number = $2
		ORDER BY os.id
    `

	var services []models.ServicesInOrder

	rows, err := r.database.Query(query, prime_id, req.Number)
	if err != nil {
		return nil, fmt.Errorf("failed to query order services: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var service models.ServicesInOrder
		err := rows.Scan(
			&service.OSID,
			&service.ServiceID,
			&service.ServiceName,
			&service.ServiceAmount,
			&service.Price,
			&service.Sost,
			&service.Worker,
		)
		if err != nil {
			log.Printf("Error scanning row: %v", err)
			return nil, fmt.Errorf("failed to scan row: %w", err)
		}

		services = append(services, service)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("rows iteration error: %w", err)
	}

	if services == nil {
		services = []models.ServicesInOrder{}
	}

	return services, nil
}

func (r *Repository) AddServicesInOrderLoad(req models.AddServicesLoaderRecieve) ([]models.AddServicesInOrderLoad, error) {

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
			s.id,
			s.name,
			CASE 
				WHEN (
					SELECT type FROM orders 
					WHERE prime_id = $1 AND number = $2
				) = 'Легковое' THEN s.price
				ELSE COALESCE(s.price2, s.price)
			END,
			CASE 
				WHEN os.id IS NOT NULL THEN 1 
				ELSE 0 
			END,
			COALESCE(os.sost, 0)
		FROM 
			services s
			LEFT JOIN orders_services os ON os.service_id = s.id 
				AND os.order_id = (
					SELECT id FROM orders 
					WHERE prime_id = $1 AND number = $2
				)
		WHERE 
			s.prime_id = $1
		ORDER BY 
			s.name;
    `

	var services []models.AddServicesInOrderLoad

	rows, err := r.database.Query(query, prime_id, req.Number)
	if err != nil {
		return nil, fmt.Errorf("failed to query services: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var service models.AddServicesInOrderLoad
		err := rows.Scan(
			&service.ID,
			&service.ServiceName,
			&service.Price,
			&service.Sost,
			&service.Editable,
		)
		if err != nil {
			log.Printf("Error scanning row: %v", err)
			return nil, fmt.Errorf("failed to scan row: %w", err)
		}

		services = append(services, service)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("rows iteration error: %w", err)
	}

	if services == nil {
		services = []models.AddServicesInOrderLoad{}
	}

	return services, nil
}

func (r *Repository) GetOrders(req models.OrdersRecieve) (*[]models.Orders, int64, int, int, error) {

	claims, err := tokens.ValidateAccessToken(req.AccessToken)
	if err != nil {
		return nil, 0, 0, 0, err
	}
	userID := claims.UserID

	page := req.Page
	if page < 0 {
		page = 0
	}

	size := req.Size
	if size <= 0 {
		size = 10
	}
	if size > 100 {
		size = 100
	}

	filterClause := ""
	orderClause := `
		ORDER BY
			CASE o.sost
				WHEN 'comp' THEN 1
				WHEN 'cl' THEN 2
				WHEN 'can' THEN 3
				ELSE 0
			END,
			o.number DESC
	`

	if req.Mode == "waiting" {
		filterClause = " AND o.sost IN ('compw', 'comp')"
		orderClause = `
		ORDER BY
			CASE o.sost
				WHEN 'compw' THEN 0
				WHEN 'comp' THEN 1
				ELSE 2
			END,
			o.number ASC
	`
	}

	countQuery := `
        SELECT COUNT(*)
		FROM orders o
		JOIN users u ON u.prime_id = o.prime_id
		WHERE u.id = $1` + filterClause + `;
    `

	var total int64
	err = r.database.QueryRow(countQuery, userID).Scan(&total)
	if err != nil {
		return nil, 0, 0, 0, fmt.Errorf("count query failed: %w", err)
	}

	if total == 0 {
		orders := []models.Orders{}
		return &orders, 0, 0, size, nil
	}

	maxPage := int((total - 1) / int64(size))
	if page > maxPage {
		page = maxPage
	}

	offset := page * size

	query := `
        SELECT o.*
		FROM orders o
		JOIN users u ON u.prime_id = o.prime_id
		WHERE u.id = $1` + filterClause + `
		` + orderClause + `
		LIMIT $2 OFFSET $3;
    `

	rows, err := r.database.Query(query, userID, size, offset)
	if err != nil {
		return nil, 0, 0, 0, fmt.Errorf("query failed: %w", err)
	}
	defer rows.Close()

	var orders []models.Orders

	for rows.Next() {
		var order models.Orders
		err := rows.Scan(
			&order.ID,
			&order.Prime_id,
			&order.Number,
			&order.Name,
			&order.Client,
			&order.Date,
			&order.Sost,
			&order.Phone,
			&order.Date_closed,
			&order.Type,
			&order.Price)
		if err != nil {
			return nil, 0, 0, 0, fmt.Errorf("scan failed: %w", err)
		}
		order.Sost = statusMapping[order.Sost]
		orders = append(orders, order)
	}
	if err = rows.Err(); err != nil {
		return nil, 0, 0, 0, fmt.Errorf("rows iteration error: %w", err)
	}

	if orders == nil {
		orders = []models.Orders{}
	}

	return &orders, total, page, size, nil
}

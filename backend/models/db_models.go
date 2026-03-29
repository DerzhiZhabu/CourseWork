package models

import (
	"database/sql"
	"time"
)

type PrimeUser struct {
	ID           int64
	Orders_count int64
}

type User struct {
	ID       int64
	Prime_id int64
	Login    string
	Password string
	Acces    string
}

type ChildUser struct {
	ID    int64  `json:"-"`
	Login string `json:"login"`
	Acces string `json:"acces"`
}

type Orders struct {
	ID          int64        `json:"-"`
	Prime_id    int64        `json:"-"`
	Number      int64        `json:"number"`
	Name        string       `json:"name"`
	Client      string       `json:"client"`
	Date        time.Time    `json:"date"`
	Sost        string       `json:"sost"`
	Phone       string       `json:"phone"`
	Date_closed sql.NullTime `json:"date_closed"`
	Type        string       `json:"type"`
	Price       float64      `json:"price"`
}

type Services struct {
	ID       int64   `json:"id"`
	Prime_id int64   `json:"-"`
	Name     string  `json:"name"`
	Price    float64 `json:"price1"`
	Price2   float64 `json:"price2"`
}

type ServicesInOrder struct {
	OSID          int64   `json:"osid"`
	ServiceID     int64   `json:"sid"`
	ServiceName   string  `json:"sname"`
	ServiceAmount int64   `json:"samount"`
	Price         float64 `json:"price"`
	Sost          int64   `json:"sost"`
	Worker        string  `json:"worker"`
}

type AddServicesInOrderLoad struct {
	ID          int64   `json:"id"`
	ServiceName string  `json:"sname"`
	Price       float64 `json:"price"`
	Sost        int64   `json:"sost"`
	Editable    int64   `json:"editable"`
}

type Worker struct {
	ID         int64   `json:"id"`
	Name       string  `json:"name"`
	Surname    string  `json:"surname"`
	Patronimic string  `json:"patronimic"`
	Procent    float64 `json:"procent"`
	Status     bool    `json:"status"`
}

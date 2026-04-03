package models

import (
	"time"
)

type RegisterRequest struct {
	Login    string `json:"login" binding:"required"`
	Password string `json:"password" binding:"required,min=6"`
}

type LoginRequest struct {
	Login    string `json:"login" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type ProfileRecieve struct {
	AccessToken string `json:"token"`
}

type ChildUsersRecieve struct {
	AccessToken string `json:"token"`
}

type ChangePasswordRecieve struct {
	AccessToken string `json:"token"`
	OldPassword string `json:"oldPassword"`
	NewPassword string `json:"newPassword"`
}

type NewChildUserRecieve struct {
	AccessToken string `json:"token"`
	Login       string `json:"login"`
	Password    string `json:"password"`
	Acces       string `json:"acces"`
}

type DeleteChildUserRecieve struct {
	AccessToken string `json:"token"`
	ID          int64  `json:"id"`
}

type LoginResponse struct {
	AccessToken  string `json:"accessToken"`
	RefreshToken string `json:"refreshToken"`
}

type OrdersRecieve struct {
	AccessToken string `json:"token"`
	Page        int    `json:"page"`
	Size        int    `json:"size"`
	Mode        string `json:"mode"`
}

type ServicesInOrderRecieve struct {
	AccessToken string `json:"token"`
	Number      int64  `json:"number"`
}

type AddServicesLoaderRecieve struct {
	AccessToken string `json:"token"`
	Number      int64  `json:"number"`
}

type ServicesRecieve struct {
	AccessToken string `json:"token"`
}

type NewOrderRecieve struct {
	AccessToken string `json:"token"`
	Name        string `json:"name"`
	Client      string `json:"client"`
	Phone       string `json:"phone"`
	Type        string `json:"type"`
}

type LoadWorkersRecieve struct {
	AccessToken string `json:"token"`
}

type LoadWorkerServicesSend struct {
	Sname   string  `json:"sname"`
	Number  int64   `json:"number"`
	Summary float64 `json:"summary"`
}

type LoadWorkerServicesRecieve struct {
	AccessToken string    `json:"token"`
	WorkerId    int64     `json:"id"`
	DateStart   time.Time `json:"dateStart"`
	DateEnd     time.Time `json:"dateEnd"`
}

type StatsRecieve struct {
	AccessToken string    `json:"token"`
	DateStart   time.Time `json:"dateStart"`
	DateEnd     time.Time `json:"dateEnd"`
}

type StatsSalaryRowSend struct {
	ID         int64   `json:"id"`
	Name       string  `json:"name"`
	Surname    string  `json:"surname"`
	Patronimic string  `json:"patronimic"`
	Procent    float64 `json:"procent"`
	Status     bool    `json:"status"`
	Salary     float64 `json:"salary"`
}

type StatsServiceRowSend struct {
	ID     int64   `json:"id"`
	Name   string  `json:"name"`
	Income float64 `json:"income"`
}

type StatsSend struct {
	SalaryRows    []StatsSalaryRowSend  `json:"salaryRows"`
	SalaryTotal   float64               `json:"salaryTotal"`
	SalaryAverage float64               `json:"salaryAverage"`
	ServiceRows   []StatsServiceRowSend `json:"serviceRows"`
	ServicesTotal float64               `json:"servicesTotal"`
	RevenueTotal  float64               `json:"revenueTotal"`
	NetProfit     float64               `json:"netProfit"`
}

type AddServiceRecieve struct {
	AccessToken string  `json:"token"`
	Number      int64   `json:"number"`
	ID          int64   `json:"id"`
	Price       float64 `json:"price"`
	Col         int64   `json:"col"`
}

type CompleteOrderServiceRecieve struct {
	AccessToken string `json:"token"`
	OSID        int64  `json:"osid"`
	WorkerID    int64  `json:"workerId"`
}

type UndoOrderServiceRecieve struct {
	AccessToken string `json:"token"`
	OSID        int64  `json:"osid"`
}

type DeleteOrderServiceRecieve struct {
	AccessToken string `json:"token"`
	OSID        int64  `json:"osid"`
}

type UpdateOrderRecieve struct {
	AccessToken string `json:"token"`
	Name        string `json:"name"`
	Client      string `json:"client"`
	Phone       string `json:"phone"`
	Type        string `json:"type"`
	Sost        string `json:"sost"`
	Number      int64  `json:"number"`
}

type NewServiceRecieve struct {
	AccessToken string  `json:"token"`
	Name        string  `json:"name"`
	Price1      float64 `json:"price1"`
	Price2      float64 `json:"price2"`
}

type UpdateServiceRecieve struct {
	AccessToken string  `json:"token"`
	ID          int64   `json:"id"`
	Name        string  `json:"name"`
	Price1      float64 `json:"price1"`
	Price2      float64 `json:"price2"`
}

type NewWorkerRecieve struct {
	AccessToken string  `json:"token"`
	Name        string  `json:"name"`
	Surname     string  `json:"surname"`
	Patronimic  string  `json:"patronimic"`
	Procent     float64 `json:"procent"`
	Sost        bool    `json:"sost"`
}

type UpdateWorkerRecieve struct {
	AccessToken string `json:"token"`
	ID          int64  `json:"id"`
	Name        string `json:"name"`
	Surname     string `json:"surname"`
	Patronimic  string `json:"patronimic"`
	Sost        bool   `json:"sost"`
}

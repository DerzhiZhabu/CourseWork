# CourseWork

## Общее описание

Проект запускается через Docker Compose и состоит из трёх сервисов:

- `postgres` — база данных PostgreSQL
- `backend` — серверное API на Go
- `frontend` — клиент на Angular, раздаваемый через Nginx

Backend читает настройки из переменных окружения и из внешнего конфигурационного файла, который подключается в контейнер как volume.

## Какие файлы нужно настроить

### 1. `.env`

Корневой `.env` содержит основные переменные окружения:

```env
TZ=Asia/Novosibirsk
POSTGRES_PORT=5432
FRONTEND_PORT=80
BACKEND_PORT=8080
SERVER_PORT=8080
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=mydb
DB_HOST=postgres
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=mydb
DB_SSLMODE=disable
ENV_FILE=/app/.env
APP_CONFIG_PATH=/app/config/app-config.json
JWT_ACCESS_SECRET=change-me-access-secret-key-for-coursework-32-bytes-min
JWT_REFRESH_SECRET=change-me-refresh-secret-key-for-coursework-32-bytes-min
TESTER_UID=100001
TESTER_GID=100001
```

Docker Compose читает этот файл при запуске, а затем тот же `.env` монтируется в backend-контейнер по пути `/app/.env`.

Примечания:

- `TZ` задаёт временную зону контейнеров. Значение по умолчанию: `Asia/Novosibirsk`.
- `TESTER_UID` и `TESTER_GID` задают параметры пользователя `tester` внутри backend-контейнера.
- `SERVER_PORT` — внутренний порт backend внутри контейнера. Лучше оставлять `8080`, если отдельно не меняется `frontend/angular_project/nginx.conf`.
- `BACKEND_PORT` — внешний порт backend на хост-машине.
- `JWT_ACCESS_SECRET` и `JWT_REFRESH_SECRET` — секреты для подписи access/refresh токенов. Для реального использования их лучше заменить на свои значения длиной не менее 32 символов.

### 2. `backend/config/app-config.json`

Этот файл хранит runtime-конфигурацию backend и подключается в контейнер как `read-only` volume.

Путь внутри контейнера:

```text
/app/config/app-config.json
```

В файле хранятся:

- таймауты HTTP-сервера
- настройки CORS

## Сборка и запуск

1. При необходимости отредактируйте корневой `.env`.
2. При необходимости отредактируйте `backend/config/app-config.json`.
3. Соберите и запустите все сервисы:

```bash
docker compose up --build -d
```

4. Проверьте состояние контейнеров:

```bash
docker compose ps
```

5. Посмотрите логи backend:

```bash
docker compose logs -f backend
```

6. Откройте приложение в браузере:

```text
http://localhost
```

## Остановка проекта

Остановить контейнеры:

```bash
docker compose down
```

Остановить контейнеры и удалить volume базы данных:

```bash
docker compose down -v
```

## Важные детали реализации

- Для всех сервисов настроено `restart: always`.
- Backend-образ запускается не от root, а от пользователя `tester`.
- Конфигурационный файл backend не вшивается в образ и подключается отдельно как volume.
- Логи backend пишутся в `stdout`, поэтому доступны через `docker logs` и `docker compose logs`.

FROM golang:1.26.1-alpine3.23 AS builder

WORKDIR /src

RUN apk add --no-cache ca-certificates tzdata

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -trimpath -ldflags="-s -w" -o /out/backend-api ./cmd/api

FROM alpine:3.23.3

ARG TESTER_UID=100001
ARG TESTER_GID=100001

WORKDIR /app

RUN apk add --no-cache ca-certificates tzdata && \
    addgroup -g ${TESTER_GID} -S tester && \
    adduser -S -D -H -u ${TESTER_UID} -G tester tester && \
    mkdir -p /app/config && \
    chown -R tester:tester /app

COPY --from=builder /out/backend-api /app/backend-api

USER tester:tester

EXPOSE 8080

ENTRYPOINT ["/app/backend-api"]

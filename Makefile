.DEFAULT_GOAL := help
.PHONY: help install dev dev-services dev-client prod-build prod-up down logs \
        lint test test-user test-wss clean

help:
	@printf '%s\n' \
		'Tares development and production commands:' \
		'  make install       Install user-service and client dependencies' \
		'  make dev           Start backend infrastructure in Docker and Vite on the host' \
		'  make down          Stop compose services' \
		'  make logs          Follow compose logs' \
		'  make lint          Run service linters' \
		'  make test          Run backend and client tests' \
		'  make clean         Remove generated build artifacts'\
		'  make proto-go      Generate go protobuf in wss_microservice stub'\
		'  make wss_go_tidy   Tidy go mods ' \
		'  make user_db_generate  Generate SQL schema ' \
		'  make user_db_migrate   Migrates SQL schema to DB'\
		'  make up               Spin up Docker Resources without client'

install:
	cd backend/user_microservice && npm ci --legacy-peer-deps
	cd client && npm ci --legacy-peer-deps
	cd backend/wss_microservice && go mod download

dev:
	cd client && npm run dev
wss_go_tidy:
	cd backend/wss_microservice && go mod tidy

down:
	docker compose --profile dev --profile prod down
up:
	docker compose --profile dev up --build --remove-orphans user-db  test-userdb game-db redis user-service wss-service dev-gateway
user-testDB: 
	docker compose --profile dev up --build --remove-orphans test-userdb

logs:
	docker compose --profile dev --profile prod logs -f

lint:
	cd backend/user_microservice && npm run lint
	cd client && npm run lint
	cd backend/wss_microservice && gofmt -w . && go vet ./...

test: test-user test-wss
	cd client && npm test -- --run
lint-user:
	cd backend/user_microservice && npm run lint
test-user:
	cd backend/user_microservice && npm run test

test-wss:
	cd backend/wss_microservice && go test ./...

clean:
	rm -rf client/dist backend/wss_microservice/tmp

# user_microservice migrations and sql generation
user_db_generate:
	cd backend/user_microservice && npm run db:generate 
user_db_migrate:
	cd backend/user_microservice && npm run db:migrate

# gRPC
proto-go:
	@mkdir -p backend/wss_microservice/pkg/userpb
	protoc --proto_path=proto \
		--go_out=backend/wss_microservice/pkg/userpb --go_opt=paths=source_relative \
		--go-grpc_out=backend/wss_microservice/pkg/userpb --go-grpc_opt=paths=source_relative \
		proto/user/v1/user.proto

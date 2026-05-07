.PHONY: dev db-up db-down db-migrate db-seed db-reset

dev:
	docker compose -f infra/docker-compose.yml up -d
	pnpm --filter @wanderly/db generate
	pnpm --filter @wanderly/web dev

db-up:
	docker compose -f infra/docker-compose.yml up -d postgres redis

db-down:
	docker compose -f infra/docker-compose.yml down

db-migrate:
	pnpm --filter @wanderly/db migrate

db-seed:
	pnpm --filter @wanderly/db seed

db-reset:
	docker compose -f infra/docker-compose.yml down -v
	docker compose -f infra/docker-compose.yml up -d postgres
	sleep 3
	pnpm --filter @wanderly/db migrate
	pnpm --filter @wanderly/db seed

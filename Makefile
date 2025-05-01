# Makefile for one-command setup and DevOps workflows

.PHONY: up down build test lint deploy tf-init tf-apply

up:
	npm install
	npm run build
	docker-compose up -d

e2e:
	npm run test:e2e

lint:
	npm run lint

test:
	npm test

deploy:
	./scripts/deploy.sh

tf-init:
	cd infra/terraform && terraform init

tf-apply:
	cd infra/terraform && terraform apply -auto-approve

down:
	docker-compose down

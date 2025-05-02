# TerraFusion Command Central
# Global Variables
REPO_NAME = ghcr.io/terrafusion/backend
IMAGE_TAG ?= latest
ENV ?= dev

# File paths
SHAPEFILE_PATH ?= /mnt/data/dbo_PARCELSANDASSESS.shp

# Permissions
.PHONY: permissions
permissions:
	chmod +x scripts/*.sh

# Database Operations
.PHONY: db-migrations
db-migrations:
	./scripts/run-db-migrations.sh

.PHONY: db-status
db-status:
	./scripts/check-db-status.sh

.PHONY: db-import-gis
db-import-gis:
	chmod +x scripts/import-parcel-shapefile.sh
	./scripts/import-parcel-shapefile.sh -f $(SHAPEFILE_PATH)

# Terraform Operations
.PHONY: tf-init
tf-init:
	cd terraform && terraform init

.PHONY: tf-plan
tf-plan:
	cd terraform && terraform plan -var-file=environments/$(ENV).tfvars

.PHONY: tf-apply
tf-apply:
	cd terraform && terraform apply -auto-approve -var-file=environments/$(ENV).tfvars

.PHONY: tf-destroy
tf-destroy:
	cd terraform && terraform destroy -var-file=environments/$(ENV).tfvars

# Docker Operations
.PHONY: docker-build
docker-build:
	docker build -f docker/backend.Dockerfile -t $(REPO_NAME):$(IMAGE_TAG) .

.PHONY: docker-push
docker-push:
	docker push $(REPO_NAME):$(IMAGE_TAG)

# Helm Operations
.PHONY: helm-init
helm-init:
	helm repo add terrafusion https://charts.terrafusion.io
	helm repo update

.PHONY: helm-up
helm-up:
	helm upgrade --install terrafusion-backend ./helm/terrafusion-backend \
		--namespace terrafusion \
		--create-namespace \
		--set image.tag=$(IMAGE_TAG) \
		--set environment=$(ENV) \
		--values ./helm/environments/$(ENV).yaml

.PHONY: helm-down
helm-down:
	helm uninstall terrafusion-backend --namespace terrafusion

# Full Deployment Pipelines
.PHONY: deploy-dev
deploy-dev: docker-build docker-push helm-up
	@echo "Deployed to development environment"

.PHONY: deploy-staging
deploy-staging: 
	$(MAKE) deploy-env ENV=staging IMAGE_TAG=staging

.PHONY: deploy-prod
deploy-prod:
	$(MAKE) deploy-env ENV=prod IMAGE_TAG=production

.PHONY: deploy-env
deploy-env: docker-build docker-push helm-up
	@echo "Deployed to $(ENV) environment"

# Secret Rotation
.PHONY: rotate-secrets
rotate-secrets:
	./scripts/rotate-secrets.sh

# Testing Operations
.PHONY: test-api
test-api:
	npm run test:api

.PHONY: test-gis
test-gis:
	node scripts/test-gis-api.js

.PHONY: test-e2e
test-e2e:
	npm run test:e2e

# Local Development
.PHONY: dev
dev:
	npm run dev

.PHONY: setup
setup: permissions
	npm install
	./scripts/setup-local-env.sh

# Help
.PHONY: help
help:
	@echo "TerraFusion Make Commands:"
	@echo ""
	@echo "Database:"
	@echo "  make db-migrations         Run database migrations"
	@echo "  make db-status             Check database status"
	@echo "  make db-import-gis         Import GIS data from shapefile"
	@echo ""
	@echo "Infrastructure (Terraform):"
	@echo "  make tf-init               Initialize Terraform"
	@echo "  make tf-plan               Plan Terraform changes"
	@echo "  make tf-apply              Apply Terraform changes"
	@echo "  make tf-destroy            Destroy Terraform infrastructure"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-build          Build Docker image"
	@echo "  make docker-push           Push Docker image to registry"
	@echo ""
	@echo "Kubernetes (Helm):"
	@echo "  make helm-init             Initialize Helm repos"
	@echo "  make helm-up               Deploy/update Helm charts"
	@echo "  make helm-down             Remove Helm deployment"
	@echo ""
	@echo "Deployment Pipelines:"
	@echo "  make deploy-dev            Deploy to development environment"
	@echo "  make deploy-staging        Deploy to staging environment"
	@echo "  make deploy-prod           Deploy to production environment"
	@echo ""
	@echo "Testing:"
	@echo "  make test-api              Run API tests"
	@echo "  make test-gis              Run GIS subsystem tests"
	@echo "  make test-e2e              Run end-to-end tests"
	@echo ""
	@echo "Local Development:"
	@echo "  make dev                   Start development server"
	@echo "  make setup                 Set up local development environment"
	@echo ""
	@echo "Security:"
	@echo "  make rotate-secrets        Rotate secrets"
	@echo ""

# Default target
.DEFAULT_GOAL := help
# Enhanced DevOps Features for TerraFusion

This document outlines the enhanced DevOps features that have been added to the TerraFusion DevOps Kit, including automated UI testing, code coverage enforcement, PR preview environments, and observability.

## Table of Contents

1. [Automated UI Testing with Cypress](#automated-ui-testing-with-cypress)
2. [Code Coverage Enforcement](#code-coverage-enforcement)
3. [PR Preview Environments](#pr-preview-environments)
4. [Parameterized Deployments](#parameterized-deployments)
5. [Observability and Monitoring](#observability-and-monitoring)

## Automated UI Testing with Cypress

The TerraFusion DevOps Kit now includes Cypress for end-to-end testing. This ensures that your UI components work correctly from a user's perspective.

### Setup

1. Install Cypress and related dependencies:

```bash
npm install --save-dev cypress @cypress/testing-library @cypress/code-coverage
```

2. Copy the sample files from `devops/testing/` to your UI project:
   - `cypress.json` → root of your UI project
   - `cypress-plugins-index.js` → `cypress/plugins/index.js` in your UI project

3. Create test files in `cypress/integration/` directory (see `cypress-setup.md` for examples)

### Running Tests

- Locally: `npx cypress open` or `npm run cy:open`
- In CI: The GitHub Actions workflow will automatically run Cypress tests

## Code Coverage Enforcement

Code coverage is now enforced both for unit tests and E2E tests to ensure proper test coverage of your codebase.

### Setup

1. Copy `.nycrc` from `devops/testing/` to the root of your project

2. Add the following to your `package.json`:

```json
"scripts": {
  "test": "jest --coverage",
  "coverage:ci": "nyc npm test && nyc report --reporter=text-lcov | coveralls"
}
```

### Coverage Requirements

- 80% line coverage
- 80% branch coverage
- 80% function coverage
- 80% statement coverage

The CI pipeline will fail if these thresholds are not met.

## PR Preview Environments

Every pull request now automatically gets its own preview environment deployed to Kubernetes.

### How It Works

1. When a PR is opened, the GitHub Actions workflow:
   - Builds Docker images with PR-specific tags
   - Deploys a separate instance of the application with a unique hostname
   - Comments on the PR with the preview URL

2. You can access the preview at: `https://preview-<PR-NUMBER>.wizard.terrafusion.local`

3. When the PR is merged or closed, the preview environment is automatically deleted

### Testing Preview Environments

1. Open a pull request
2. Wait for the GitHub Actions workflow to complete
3. Click on the preview URL in the PR comment
4. Test your changes in a real, isolated environment

## Parameterized Deployments

The Terraform configuration now supports environment-based deployments.

### Environment Variables

The Terraform configuration includes:

```hcl
variable "environment" {
  description = "Environment name"
  type        = string
  default     = "staging"
}

locals {
  release_suffix = var.environment == "production" ? "" : "-${var.environment}"
}
```

### Multiple Environments

You can now deploy to different environments by specifying the environment variable:

```bash
terraform apply -var="environment=staging"
terraform apply -var="environment=production"
terraform apply -var="environment=preview-123"
```

## Observability and Monitoring

The DevOps Kit now includes comprehensive observability features. See `devops/observability/README.md` for detailed setup instructions.

### Features

1. **Metrics Collection**: Prometheus integration for collecting application and system metrics
2. **Distributed Tracing**: OpenTelemetry integration for tracing requests across services
3. **Centralized Logging**: Loki integration for aggregating logs from all services
4. **Alerting**: Alertmanager integration for sending notifications on critical issues
5. **Dashboards**: Grafana integration for visualizing metrics, logs, and traces

### Implementation

The observability configuration is automatically included in the Helm chart values:

```yaml
observability:
  enabled: true
  prometheus:
    scrape: true
  opentelemetry:
    enabled: true
    endpoint: "http://otel-collector:4317"
```

### Accessing Monitoring Tools

- Grafana: `kubectl port-forward svc/prometheus-grafana 3000:80 -n monitoring`
- Prometheus: `kubectl port-forward svc/prometheus-server 9090:80 -n monitoring`
- Loki: Accessible through Grafana

## Next Steps

1. **Implement Application Instrumentation**: Add metrics and tracing to your application code
2. **Create Custom Dashboards**: Build Grafana dashboards specific to your services
3. **Configure Alerts**: Set up alerts for critical service health indicators
4. **Add Advanced E2E Tests**: Expand your Cypress test suite to cover more user flows
5. **Integrate Load Testing**: Add performance testing to your CI/CD pipeline
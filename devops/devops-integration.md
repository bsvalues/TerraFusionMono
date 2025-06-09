# TerraFusion DevOps Integration Guide

This document explains how to integrate the TerraFusion DevOps Kit with your existing CI/CD infrastructure.

## Integration with Existing Workflows

We noticed that your repository already contains several GitHub Actions workflow files:
- `.github/workflows/ci.yml`
- `.github/workflows/deploy.yml`
- `.github/workflows/infra-matrix.yml`
- `.github/workflows/main.yml`
- `.github/workflows/pull-request.yml`

The new CI/CD workflow (`ci-cd.yaml`) we've added is designed to work alongside these existing workflows. Here are some integration options:

### Option 1: Standalone Operation

You can keep the new workflow separate from your existing ones, allowing it to handle only the API Gateway and Valuation Wizard deployment. This is the simplest approach and requires no modifications to your existing workflows.

### Option 2: Workflow Orchestration

You can modify your existing main workflow to call the new one at the appropriate stage in your CI/CD process:

1. In your main workflow, add a job that triggers only after the build and test jobs have completed successfully
2. Use the `workflow_call` trigger in the new workflow to allow it to be invoked from other workflows
3. Pass any necessary context (environment name, etc.) as parameters

Example modification to the `ci-cd.yaml`:

```yaml
# Add this at the top of ci-cd.yaml
on:
  push:
    branches: [ main ]
  workflow_call:
    inputs:
      environment:
        description: 'Environment to deploy to'
        required: false
        default: 'production'
        type: string
```

### Option 3: Workflow Consolidation

If you prefer to have a single, comprehensive CI/CD pipeline, you can incorporate the steps from the new workflow into your existing main workflow:

1. Add the build, push, and deploy jobs from `ci-cd.yaml` to your main workflow
2. Ensure that they run after your existing build and test jobs
3. Use conditions to control when these jobs run (e.g., only on main branch or only for specific services)

## Database Considerations

The DevOps Kit doesn't explicitly handle database migrations. If your API Gateway or Valuation Wizard services require database changes, consider:

1. Adding database migration steps to the CI/CD workflow
2. Using Terraform to manage database infrastructure
3. Implementing a separate database migration workflow that runs before deployment

## Monitoring and Observability

For complete observability of your deployed services:

1. Configure your Kubernetes cluster to collect logs from the deployed services
2. Add Prometheus ServiceMonitor resources to your Helm charts
3. Set up Grafana dashboards for monitoring your services

## Security Best Practices

1. Regularly rotate your GitHub Secrets
2. Use RBAC to limit Kubernetes permissions
3. Scan your container images for vulnerabilities
4. Use sealed secrets or external secret management for sensitive data

## Next Steps

1. Review your existing CI/CD processes
2. Decide on the integration approach that best fits your needs
3. Test the integrated workflows in a staging environment
4. Gradually roll out to production
# TerraFusion DevOps Kit

This DevOps Kit provides ready-to-use infrastructure as code (IaC), Helm charts, and CI/CD pipelines to deploy both the API Gateway and the Valuation Wizard UI service.

## Directory Structure

```
/devops
  /terraform        # Terraform configuration for Kubernetes deployments
  /helm             # Helm charts for services
    /valuation-wizard # Helm chart for Valuation Wizard UI
  /.github/workflows # GitHub Actions CI/CD workflow
    /ci-cd.yaml      # Main CI/CD pipeline
```

## How to Use

1. Ensure the directory structure is set up correctly with all the files in place
2. Configure GitHub Secrets for your repository:
   - `DOCKER_REPO` - Your Docker registry repository
   - `DOCKER_USERNAME` - Username for Docker registry authentication
   - `DOCKER_PASSWORD` - Password for Docker registry authentication
   - `KUBECONFIG_PATH` - Path to the kubeconfig file on the GitHub Actions runner

3. Configure your Dockerfiles in the appropriate locations:
   - For API Gateway: `/services/api-gateway/Dockerfile`
   - For Valuation Wizard: `/valuation-wizard/Dockerfile`

4. Ensure the Docker build context in these Dockerfiles matches the structure expected by the CI/CD workflow

5. Commit and push your changes to the main branch to trigger the CI/CD pipeline

## CI/CD Process

The GitHub Actions workflow will:
1. Build Docker images for both services
2. Push the images to your Docker registry
3. Deploy the services to Kubernetes using Terraform and Helm

## Customization

You can customize the deployment by modifying:
- The Terraform variables in `devops/terraform/variables.tf`
- The Helm chart values in `devops/helm/valuation-wizard/values.yaml`
- The CI/CD workflow in `.github/workflows/ci-cd.yaml`
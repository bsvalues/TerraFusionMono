# TerraFusion DevOps Kit - QuickStart Guide

This QuickStart guide will help you get up and running with the TerraFusion DevOps Kit in minutes.

## Prerequisites

- GitHub account with permissions to add secrets to your repository
- Kubernetes cluster accessible via kubeconfig
- Docker registry credentials
- Docker installed locally for testing builds (optional)

## Step 1: Configure GitHub Secrets

Add the following secrets to your GitHub repository:

1. `DOCKER_REPO` - Your Docker registry repository
2. `DOCKER_USERNAME` - Username for Docker registry authentication
3. `DOCKER_PASSWORD` - Password for Docker registry authentication
4. `KUBECONFIG_PATH` - Path to the kubeconfig file on the GitHub Actions runner

See `GITHUB_SECRETS.md` for detailed instructions.

## Step 2: Set Up Dockerfiles

1. If you don't already have Dockerfiles for your services, use the examples provided in the `dockerfile-examples` directory
2. Place the Dockerfiles in the correct locations:
   - For API Gateway: Copy to `services/api-gateway/Dockerfile`
   - For Valuation Wizard: Copy to `valuation-wizard/Dockerfile`

## Step 3: Customize Helm Chart Values

1. Edit `devops/helm/valuation-wizard/values.yaml` to match your environment:
   - Update `image.repository` to your Docker registry path
   - Modify `ingress.hosts` to use your domain names

## Step 4: Verify GitHub Actions Workflow

1. Check that the `.github/workflows/ci-cd.yaml` file is correctly configured
2. Make sure the paths in the workflow match your project structure
3. If needed, adjust the workflow to integrate with your existing CI/CD pipelines (see `devops-integration.md`)

## Step 5: Push Your Changes

1. Commit all changes to your repository
2. Push to the main branch to trigger the CI/CD pipeline

## Step 6: Monitor Deployment

1. Check the GitHub Actions tab to see the workflow progress
2. Monitor your Kubernetes cluster to see the new deployments
3. Access your services via the ingress hosts you configured

## Troubleshooting

If you encounter issues:

1. Check GitHub Actions logs for detailed error messages
2. Verify that all required secrets are correctly set
3. Ensure your Kubernetes cluster is accessible from GitHub Actions
4. Check that Docker registry credentials are valid

## Next Steps

- Add more services to the deployment pipeline
- Configure automated testing
- Set up monitoring and alerting
- Implement database migrations

For more detailed information, see the full documentation in `README.md` and `devops-integration.md`.

## Need Help?

Refer to the following resources:
- Kubernetes documentation: https://kubernetes.io/docs/
- Helm documentation: https://helm.sh/docs/
- GitHub Actions documentation: https://docs.github.com/en/actions
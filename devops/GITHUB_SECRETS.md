# GitHub Secrets Setup Guide

This document explains how to set up the required GitHub Secrets for the TerraFusion DevOps Kit CI/CD workflow.

## Required Secrets

The CI/CD pipeline requires the following secrets to be configured in your GitHub repository:

1. `DOCKER_REPO` - Your Docker registry repository (e.g., `docker.io/yourcompany`)
2. `DOCKER_USERNAME` - Username for Docker registry authentication
3. `DOCKER_PASSWORD` - Password or token for Docker registry authentication
4. `KUBECONFIG_PATH` - Path to the kubeconfig file on the GitHub Actions runner

## How to Add GitHub Secrets

1. Navigate to your GitHub repository
2. Click on "Settings" tab
3. In the left sidebar, click on "Secrets and variables" > "Actions"
4. Click on "New repository secret"
5. Add each of the secrets listed above with their respective values

## Secret Examples

- **DOCKER_REPO**: `docker.io/terrafusion` or `ghcr.io/your-organization`
- **DOCKER_USERNAME**: Your Docker Hub username or GitHub username (for GitHub Container Registry)
- **DOCKER_PASSWORD**: Your Docker Hub password/token or GitHub personal access token
- **KUBECONFIG_PATH**: `/home/runner/.kube/config` (typical path on GitHub Actions runners)

## Security Considerations

- Use secrets with the least privileges necessary
- For Docker Hub, create a dedicated access token instead of using your account password
- For GitHub Container Registry, create a PAT with only the necessary scopes (`read:packages` and `write:packages`)
- Regularly rotate your secrets to maintain security
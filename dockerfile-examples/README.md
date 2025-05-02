# Dockerfile Examples

These are example Dockerfiles to use with the TerraFusion DevOps Kit. 

## Usage

1. Copy `api-gateway.Dockerfile` to your API Gateway service directory and rename it to `Dockerfile`.
2. Copy `valuation-wizard.Dockerfile` to your Valuation Wizard UI service directory and rename it to `Dockerfile`.
3. Make any necessary adjustments to the Dockerfiles to match your specific project structure.

## Important Notes

- These Dockerfiles use a multi-stage build approach to minimize the final image size.
- Ensure that your `package.json` has appropriate scripts for building and running the applications:
  - For the build stage: `npm run build`
  - For the production stage: `npm run start:prod`
- The exposed ports (8000 for API Gateway and 3000 for Valuation Wizard) should match the ports configured in your Helm charts.
# Repository Import Guide

This document explains the repository import process used in TerraFusionMono to create a monorepo from multiple source repositories.

## Overview

The TerraFusionMono monorepo is constructed by importing multiple repositories from two main categories:
- Terra* repositories (terraagent, terraf, terraflow, etc.)
- BCBS* repositories (bcbscostapp, bcbsgispro, bcbslevy, etc.)

## Import Scripts

The repository includes several scripts to manage the import process:

- `import-repos.sh` - Main script that imports all repositories
- `import-bcbs-repos.sh` - Specifically for BCBS repositories
- `import-remaining-repos.sh` - For repositories not yet imported
- `import-single-repo.sh` - For importing a single repository

### How to Use the Import Scripts

#### Importing a Single Repository

To import a single repository:

```bash
./import-single-repo.sh RepositoryName
```

Replace `RepositoryName` with the name of the repository as it appears in the GitHub organization.

#### Importing Multiple Repositories

To import multiple repositories:

```bash
./import-repos.sh
```

or for BCBS repositories specifically:

```bash
./import-bcbs-repos.sh
```

## How the Import Process Works

The import process follows these steps:

1. **Clone** the repository from GitHub
2. **Normalize** the repository name (lowercase with dashes)
3. **Move** the repository into the `apps/` directory
4. **Remove** the `.git` directory to integrate with the monorepo
5. **Register** the repository in `workspace.json`

## Workspace Integration

After importing, each repository is registered in the `workspace.json` file to integrate with the Nx workspace:

```json
{
  "version": 2,
  "projects": {
    "repo-name": "apps/repo-name"
  }
}
```

## Post-Import Steps

After importing repositories, you need to:

1. **Set up dependencies** for each imported project
2. **Ensure compatibility** with the monorepo structure
3. **Update configuration** to use shared resources
4. **Register services** with the Apollo Federation Gateway

## Troubleshooting

### Common Issues

#### Import Timeout

If the import process times out, try importing repositories one by one:

```bash
./import-single-repo.sh RepositoryName
```

#### Missing Dependencies

If an imported repository has missing dependencies, install them:

```bash
nx run repo-name:install
```

#### Workspace Registration Failed

If a repository isn't registered in `workspace.json`, add it manually:

```json
{
  "projects": {
    "repo-name": "apps/repo-name"
  }
}
```

## Repository List

The following repositories have been imported:

### Terra Repositories
- terraagent
- terraf
- terraflow
- terrafusionpro
- terrafusionsync
- terralegislativepulsepub
- terraminer

### BCBS Repositories
- bcbscostapp
- bcbsgispro
- bcbslevy
- bcbswebhub
- bsbcmaster
- bsincomevaluation
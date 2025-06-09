# TerraFusion NX Pack

A custom NX executor for packaging TerraFusion components and bundles.

## Features

- Package components and bundles for distribution
- Validate against terra.json schema
- Generate checksums for package verification
- Generate Software Bill of Materials (SBOM)
- Sign packages with GPG
- Compress packages in various formats

## Installation

```bash
npm install @terrafusion/nx-pack --save-dev
```

## Configuration

Add the pack target to your project.json:

```json
{
  "targets": {
    "pack": {
      "executor": "@terrafusion/nx-pack:pack",
      "options": {
        "outputPath": "dist/pack",
        "includeFiles": [
          "terra.json",
          "README.md",
          "LICENSE",
          "src/**/*"
        ],
        "excludeFiles": [
          "**/*.test.js",
          "**/*.spec.js",
          "**/__tests__/**/*"
        ],
        "validateSchema": true,
        "generateChecksums": true,
        "generateSBOM": true,
        "sbomFormat": "cyclonedx"
      }
    }
  }
}
```

## Usage

Run the executor with NX:

```bash
nx run your-project:pack
```

Or run it for multiple projects:

```bash
nx run-many --target=pack --projects=mcps-agentmesh,pacs-migration-pack
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| outputPath | string | 'dist/pack' | The path to output the packaged files to |
| includeFiles | string[] | ['terra.json', 'README.md', 'LICENSE'] | Glob patterns for files to include in the package |
| excludeFiles | string[] | ['node_modules/**/*', '**/*.test.ts', '**/*.spec.ts'] | Glob patterns for files to exclude from the package |
| validateSchema | boolean | true | Validate terra.json against schema |
| generateChecksums | boolean | true | Generate checksums for packaged files |
| generateSBOM | boolean | false | Generate Software Bill of Materials |
| sbomFormat | string | 'cyclonedx' | Format for Software Bill of Materials ('cyclonedx' or 'spdx') |
| signPackage | boolean | false | Sign package with GPG |
| keyId | string | | GPG key ID to sign package with |
| compress | boolean | false | Compress package into an archive |
| compressFormat | string | 'tgz' | Format for package compression ('tar', 'zip', or 'tgz') |

## Terra.json Schema

Each TerraFusion component or bundle requires a valid terra.json file with the following structure:

```json
{
  "id": "component-id",
  "type": "service",
  "name": "Component Name",
  "version": "1.0.0",
  "description": "Component description",
  "license": "MIT",
  "author": "TerraFusion Team",
  "homepage": "https://example.com",
  "repository": "https://github.com/example/repo",
  "dependencies": [
    "other-component@1.0.0"
  ],
  "settings": {
    "key": "value"
  },
  "requirements": {
    "memory": "1Gi",
    "cpu": "0.5",
    "storage": "2Gi"
  },
  "ports": [
    {
      "name": "http",
      "port": 8080,
      "protocol": "TCP"
    }
  ],
  "metadata": {
    "category": "processing",
    "tags": ["tag1", "tag2"]
  }
}
```

## License

MIT
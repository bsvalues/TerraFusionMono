# TerraFusion NX-Pack

A custom NX plugin for packaging TerraFusion components into standalone distributable bundles.

## Installation

The `@terrafusion/nx-pack` plugin is already included in the TerraFusion monorepo and is registered in the NX workspace.

## Usage

### Packaging a Component

To package a component using the `nx-pack` plugin, run the following command:

```bash
nx run <component-name>:pack
```

For example, to package the MCPS Agent Mesh:

```bash
nx run mcps-agentmesh:pack
```

Or to package the PACS Migration Pack:

```bash
nx run pacs-migration-pack:pack
```

### Output

The packaged components will be available in the `dist/pack/<component-name>` directory. For example:

- MCPS Agent Mesh: `dist/pack/mcps-agentmesh`
- PACS Migration Pack: `dist/pack/pacs-migration-pack`

### Configuration

The packaging executor can be configured in the component's `project.json` file:

```json
{
  "targets": {
    "pack": {
      "executor": "@terrafusion/nx-pack:pack",
      "options": {
        "outputPath": "dist/pack",
        "includeFiles": ["terra.json", "README.md", "LICENSE"],
        "excludeFiles": ["node_modules", ".git", "dist"],
        "generateChecksums": true
      }
    }
  }
}
```

#### Options

- `outputPath`: The directory where packaged files will be placed (default: `dist/pack`)
- `includeFiles`: List of files to include in the package (default: `["terra.json", "README.md", "LICENSE"]`)
- `excludeFiles`: List of patterns to exclude from the package (default: `["node_modules", ".git", "dist"]`)
- `generateChecksums`: Whether to generate SHA256 checksums for packaged files (default: `true`)

## Adding Pack Support to a New Component

1. Create a `terra.json` file in the component's root directory:

```json
{
  "id": "component-id",
  "type": "service|bundle",
  "name": "Component Name",
  "version": "0.1.0"
}
```

2. Add the pack target to the component's `project.json`:

```json
{
  "targets": {
    "pack": {
      "executor": "@terrafusion/nx-pack:pack",
      "options": {
        "outputPath": "dist/pack"
      }
    }
  }
}
```

## CI Integration

The packaging process is integrated with the CI pipeline in `.github/workflows/infra-matrix.yml`. When changes are pushed to the repository, the CI pipeline will automatically:

1. Run tests
2. Perform linting
3. Package the components
4. Upload the packaged artifacts
# PACS Migration Pack 📦

Turn-key bundle that moves a county from legacy PACS 9.x SQL Server
into TerraFusion’s modern cloud stack.

| Component | Role |
|-----------|------|
| **cdc-etl**        | 5-minute change-data-capture from SQL Server → PostGIS |
| **MCPS Agent-Mesh**| AI validation swarm (schema parity, test cases, PII scan) |
| **levy-service**   | Washington statutory levy engine (REST + GraphQL) |
| **levy-UI plugin** | React dashboard that surfaces real-time levy math |

## Quick start

```bash
# inside TerraFusionMono
nx run pacs-migration-pack:pack          # create /dist/pack artefacts
./scripts/pacs_wizard.sh --env dev \
                         --bundle pacs-migration-pack \
                         --namespace terrafusion
```

The wizard:

1. Creates your namespace  
2. Pulls each component’s `terra.json`  
3. Helm-installs them with a single command  

Once complete, open the marketplace UI → **Bundles** to verify a 🟢 status badge.

## Versioning

This bundle tracks **minor** updates for its components (`>=0.x <1.x`).  
Pin a specific version in `contains[]` if you need full reproducibility.

## Billing

Metered on `cdc-etl` rows processed **or** `agentmesh` jobs run – whichever is higher.

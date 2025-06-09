
# TerraFusion PACS Migration Runbook

## Purpose
Step-by-step instructions for executing the PACS → TerraFusion cut‑over.

1. **Freeze** production PACS at 17:00 PDT Friday.
2. Run `etl/docker-compose up -d` to start CDC.
3. Validate row counts via `scripts/validate_counts.sql`.
4. Begin 30‑day parallel run; monitor Grafana board.
5. Steering committee go/no‑go at +30 days.
6. Flip DNS and unlock TerraFusion write mode.
7. File final certification package.

## Rollback
- Restore PACS backups (L0 + L1)
- Repoint DNS
- Notify stakeholders

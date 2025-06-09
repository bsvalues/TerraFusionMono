# Database Migrations Runbook

## Overview  
This runbook describes how to apply, test, and rollback database schema migrations for TerraFusion's property assessment and taxation database using Flyway.

---

## Prerequisites  
- Flyway CLI installed (v9.x)  
- Read/write access to target PostgreSQL instance  
- `flyway.conf` configured with correct `url`, `user`, `password`, `schemas`, and `locations`  

---

## Migration Workflow

### 1. Baseline (V1)  
- **Purpose**: Capture existing production schema.  
- **Command**:
  ```bash
  flyway -configFiles=flyway.conf baseline
  ```

### 2. Apply New Migrations  
- **Command**:
  ```bash
  flyway -configFiles=flyway.conf migrate
  ```
- **Verify**:
  ```bash
  flyway -configFiles=flyway.conf info
  ```
  Ensure all pending migrations are marked **"Success"**.

### 3. Smoke Test  
- Run automated rollback CI job (`db-migrations-rollback.yaml`).  
- Manually spot-check critical tables:
  ```sql
  SELECT * FROM appraisal.property LIMIT 10;
  SELECT * FROM billing.levy_bill LIMIT 10;
  ```

---

## Rollback Procedure

> **Warning**: Undo should only be used on staging/test environments.

1. **Undo Last Migration**:
   ```bash
   flyway -configFiles=flyway.conf undo
   ```
2. **Validate State**:
   ```bash
   flyway info
   ```
   - Last migration should show **"Undone"**.  
   - Previous migrations remain **"Success"**.

3. **Reapply if Needed**:
   ```bash
   flyway -configFiles=flyway.conf migrate
   ```

---

## Emergency Rollback (Production)

1. **Identify bad migration version** (e.g. V5__analysis_views).  
2. **Temporarily disable application traffic** (drain connections).  
3. **Run undo**:
   ```bash
   flyway -configFiles=flyway.conf undoCount=1
   ```
4. **Verify schema** and run regression tests.  
5. **Re-enable traffic**.

---

## Troubleshooting

| Symptom                                    | Possible Cause                  | Remediation                          |
|--------------------------------------------|---------------------------------|--------------------------------------|
| Migration fails with FK violation          | Data violates new constraint    | Clean/separate staging; fix data     |
| `undo` does not revert changes             | Migration script not undoable   | Manually reverse DDL; mark as undone |
| CI job times out waiting for PostgreSQL    | Service health check too strict | Increase retries or timeout          |

---

## Contacts

- **DB Architect**: db-team@terrafusion.local  
- **DevOps Lead**: ops@terrafusion.local  
- **On-call Pager**: PagerDuty "terra-db" schedule  

---

_Last updated: May 2, 2025_
# Monitoring & Alerting for TerraFusionPlatform

## Metrics & Dashboards
- **Recommended stack:** Prometheus + Grafana
- **Sample Prometheus config:**
```yaml
scrape_configs:
  - job_name: 'terrafusion-api'
    static_configs:
      - targets: ['localhost:3000']
```
- **Grafana dashboards:** Import Prometheus as a data source and use built-in dashboards for API, DB, and infra metrics.

## Logging
- **Recommended stack:** ELK (Elasticsearch, Logstash, Kibana) or EFK (Fluentd)
- **Sample Fluentd config:**
```conf
<source>
  @type tail
  path /var/log/app/*.log
  pos_file /var/log/td-agent/app.pos
  tag app.log
  format none
</source>
<match app.log>
  @type elasticsearch
  host elasticsearch
  port 9200
</match>
```

## Alerting
- **Prometheus Alertmanager:**
```yaml
route:
  receiver: 'email-alerts'
receivers:
  - name: 'email-alerts'
    email_configs:
      - to: 'your-team@example.com'
        from: 'alertmanager@example.com'
        smarthost: 'smtp.example.com:587'
        auth_username: 'alertmanager'
        auth_password: 'password'
```
- **PagerDuty, Slack, or Opsgenie** integrations are supported by Alertmanager.

## Health Checks
- Expose `/healthz` endpoints in all services for uptime monitoring.

---

_Adapt these configs to your stack and environment. Add runbooks for incident response as you mature your monitoring._

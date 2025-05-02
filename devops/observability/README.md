# TerraFusion Observability Setup

This guide explains how to set up and use the observability features integrated into the TerraFusion DevOps Kit, including centralized logging, metrics collection, and distributed tracing.

## Overview

The TerraFusion DevOps Kit includes built-in support for:

1. **Prometheus metrics** - For monitoring system and application metrics
2. **OpenTelemetry tracing** - For distributed tracing across services
3. **Centralized logging** - For aggregating logs from all services

## Architecture

The observability stack consists of several components:

- **Prometheus** - Scrapes and stores metrics from services
- **OpenTelemetry Collector** - Collects traces and forwards them to backend
- **Grafana** - Visualizes metrics and traces
- **Loki** - Aggregates and indexes logs
- **Alert Manager** - Handles alerting based on metrics

## Prerequisites

Before proceeding, ensure you have:

1. A running Kubernetes cluster
2. Helm 3.x installed
3. The TerraFusion DevOps Kit properly installed

## Installation

### 1. Deploy the Observability Stack

```bash
# Add Prometheus Community Helm repository
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

# Install Prometheus Operator
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --set grafana.enabled=true \
  --set alertmanager.enabled=true

# Install OpenTelemetry Collector
helm install otel-collector open-telemetry/opentelemetry-collector \
  --namespace monitoring \
  --set mode=deployment \
  --set config.exporters.otlp.endpoint=tempo:4317
  
# Install Loki for logs
helm install loki grafana/loki-stack \
  --namespace monitoring \
  --set grafana.enabled=false \
  --set promtail.enabled=true
```

### 2. Configure Services to Use the Observability Stack

The TerraFusion DevOps Kit already includes configurations for sending metrics, logs, and traces to the observability stack. You can see this in the Terraform configuration:

```hcl
observability = {
  enabled = true
  prometheus = {
    scrape = true
  }
  opentelemetry = {
    enabled = true
    endpoint = "http://otel-collector:4317"
  }
}
```

## Accessing Dashboards

After deployment, you can access the Grafana dashboard:

```bash
# Port-forward Grafana
kubectl port-forward svc/prometheus-grafana 3000:80 -n monitoring
```

Then open your browser at http://localhost:3000 (default credentials: admin/prom-operator)

## Adding Application Metrics and Traces

### Node.js Services

1. **Install dependencies**:

```bash
npm install @opentelemetry/sdk-node @opentelemetry/exporter-trace-otlp-http prom-client
```

2. **Initialize OpenTelemetry**:

```javascript
// tracing.js
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://otel-collector:4317/v1/traces',
  }),
  serviceName: 'your-service-name',
});

sdk.start();
```

3. **Expose Prometheus metrics**:

```javascript
// metrics.js
const promClient = require('prom-client');
const collectDefaultMetrics = promClient.collectDefaultMetrics;
const Registry = promClient.Registry;
const register = new Registry();
collectDefaultMetrics({ register });

// Example custom metric
const httpRequestDurationMicroseconds = new promClient.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [1, 5, 15, 50, 100, 200, 500, 1000, 2000]
});
register.registerMetric(httpRequestDurationMicroseconds);

// Express route to expose metrics
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

## Creating Custom Dashboards

You can create custom Grafana dashboards for your specific services:

1. Login to Grafana
2. Click "+" > "Dashboard"
3. Add panels using PromQL queries for metrics

Example PromQL queries:
- `rate(http_request_duration_ms_sum[5m]) / rate(http_request_duration_ms_count[5m])` - HTTP request duration
- `sum(up{app="valuation-wizard"}) / count(up{app="valuation-wizard"})` - Service uptime percentage

## Alerting

You can set up alerts based on metrics:

1. In Grafana, navigate to the dashboard with the panel you want to alert on
2. Click on the panel title > Edit
3. Click on the "Alert" tab
4. Configure alert conditions
5. Set notification channels (e.g., email, Slack)

## Troubleshooting

Common issues and solutions:

1. **Metrics not appearing in Prometheus**
   - Check if ServiceMonitor is created correctly
   - Verify that the application exposes metrics on the expected path
   - Ensure labels match between ServiceMonitor and service

2. **Traces not appearing in Tempo**
   - Verify OTEL_EXPORTER_OTLP_ENDPOINT environment variable is set correctly
   - Check if the OpenTelemetry Collector is running
   - Look at otel-collector logs for any errors

3. **Logs not appearing in Loki**
   - Ensure Promtail is running in the same namespace as your application
   - Check Promtail configuration and logs
   - Verify log formats are compatible with Promtail parsing

## Best Practices

1. **Structure logs as JSON** for better parsing and querying
2. **Use consistent metric naming** across services
3. **Add trace context to logs** to correlate logs with traces
4. **Use request IDs** across service boundaries for tracing
5. **Set appropriate retention periods** for metrics and logs
6. **Add alerts for critical components** like database connections and API endpoints
provider "kubernetes" {
  config_path = var.kubeconfig
}

provider "helm" {
  kubernetes {
    config_path = var.kubeconfig
  }
}

resource "helm_release" "api_gateway" {
  name       = "api-gateway${local.release_suffix}"
  repository = "https://example.com/charts"
  chart      = "api-gateway"
  version    = "0.1.0"
  values = [
    yamlencode({
      image   = { repository = var.api_gateway_image, tag = "latest" }
      service = { port       = 8000 }
      environment = var.environment
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
    })
  ]
}

resource "helm_release" "valuation_wizard" {
  name       = "valuation-wizard${local.release_suffix}"
  repository = "https://example.com/charts"
  chart      = "valuation-wizard"
  version    = "0.1.0"
  values = [
    yamlencode({
      image   = { repository = var.wizard_image, tag = "latest" }
      service = { port       = 3000 }
      environment = var.environment
      ingress = {
        enabled = true
        hosts = [
          {
            host = var.environment == "production" ? "wizard.terrafusion.local" : "${var.environment}.wizard.terrafusion.local",
            paths = ["/"]
          }
        ]
      }
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
    })
  ]
}
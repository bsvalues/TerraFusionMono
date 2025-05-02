provider "kubernetes" {
  config_path = var.kubeconfig
}

provider "helm" {
  kubernetes {
    config_path = var.kubeconfig
  }
}

resource "helm_release" "api_gateway" {
  name       = "api-gateway"
  repository = "https://example.com/charts"
  chart      = "api-gateway"
  version    = "0.1.0"
  values = [
    yamlencode({
      image   = { repository = var.api_gateway_image, tag = "latest" }
      service = { port       = 8000 }
    })
  ]
}

resource "helm_release" "valuation_wizard" {
  name       = "valuation-wizard"
  repository = "https://example.com/charts"
  chart      = "valuation-wizard"
  version    = "0.1.0"
  values = [
    yamlencode({
      image   = { repository = var.wizard_image, tag = "latest" }
      service = { port       = 3000 }
    })
  ]
}
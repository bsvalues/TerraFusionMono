variable "kubeconfig" {
  description = "Path to kubeconfig file"
  type        = string
}

variable "api_gateway_image" {
  description = "Docker image for API Gateway"
  type        = string
}

variable "wizard_image" {
  description = "Docker image for Valuation Wizard"
  type        = string
}
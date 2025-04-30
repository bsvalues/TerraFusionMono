#!/usr/bin/env bash
#
# TerraFusion PACS Migration Wizard
# This script helps with installing and configuring the PACS Migration Pack

set -e

# Version information
VERSION="1.0.0"
BUNDLE_VERSION="1.0.0"

# Environment and configuration
NAMESPACE="terrafusion"
ENVIRONMENT="dev"
LOG_LEVEL="info"
BUNDLE="pacs-migration-pack"
INSTALLED=()
CONFIG_FILE=""

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to show usage banner
show_usage() {
  cat << EOF
${BLUE}TerraFusion PACS Migration Wizard v${VERSION}${NC}

${GREEN}USAGE:${NC}
  $0 [OPTIONS]

${GREEN}OPTIONS:${NC}
  -h, --help              Show this help message
  -n, --namespace NAME    Kubernetes namespace to use (default: terrafusion)
  -e, --environment ENV   Environment to deploy to (dev, staging, prod, ci)
  -c, --config FILE       Configuration file path
  -b, --bundle NAME       Bundle to deploy (default: pacs-migration-pack)
  -r, --rollback          Rollback the last installation
  -v, --verbose           Enable verbose output

${GREEN}EXAMPLES:${NC}
  $0 --namespace medical-system
  $0 --environment prod --config ./my-config.yaml
  $0 --rollback

For more information, visit: https://docs.terrafusion.io/pacs-migration
EOF
}

# Function to log messages
log() {
  local level=$1
  local message=$2
  
  case $level in
    "info")
      echo -e "${BLUE}[INFO]${NC} $message"
      ;;
    "success")
      echo -e "${GREEN}[SUCCESS]${NC} $message"
      ;;
    "warn")
      echo -e "${YELLOW}[WARNING]${NC} $message"
      ;;
    "error")
      echo -e "${RED}[ERROR]${NC} $message"
      ;;
    *)
      echo -e "$message"
      ;;
  esac
}

# Error handling and cleanup
cleanup() {
  log "info" "Cleaning up..."
}

error_handler() {
  local exit_code=$?
  local line_number=$1
  
  log "error" "Error occurred at line $line_number with exit code $exit_code"
  
  # Perform rollback if there are installed components
  if [ ${#INSTALLED[@]} -gt 0 ]; then
    log "warn" "Rolling back installed components..."
    for component in "${INSTALLED[@]}"; do
      log "info" "Rolling back $component..."
      helm uninstall "$component" --namespace "$NAMESPACE" || true
    done
  fi
  
  exit $exit_code
}

trap 'error_handler $LINENO' ERR
trap cleanup EXIT

# Function to validate environment
validate_environment() {
  case $ENVIRONMENT in
    "dev"|"staging"|"prod"|"ci")
      log "info" "Using environment: $ENVIRONMENT"
      ;;
    *)
      log "error" "Invalid environment: $ENVIRONMENT"
      log "error" "Valid options are: dev, staging, prod, ci"
      exit 1
      ;;
  esac
}

# Function to check prerequisites
check_prerequisites() {
  log "info" "Checking prerequisites..."
  
  # Check for kubectl
  if ! command -v kubectl &> /dev/null; then
    log "error" "kubectl is not installed or not in PATH"
    exit 1
  fi
  
  # Check for helm
  if ! command -v helm &> /dev/null; then
    log "error" "helm is not installed or not in PATH"
    exit 1
  fi
  
  # Check connection to Kubernetes cluster
  if ! kubectl cluster-info &> /dev/null; then
    log "error" "Cannot connect to Kubernetes cluster"
    exit 1
  fi
  
  # Check if namespace exists
  if ! kubectl get namespace "$NAMESPACE" &> /dev/null; then
    log "info" "Namespace $NAMESPACE does not exist, creating..."
    kubectl create namespace "$NAMESPACE"
  fi
  
  log "success" "All prerequisites met"
}

# Function to load configuration file
load_config() {
  if [ -z "$CONFIG_FILE" ]; then
    log "warn" "No configuration file specified, using defaults"
    return
  fi
  
  if [ ! -f "$CONFIG_FILE" ]; then
    log "error" "Configuration file not found: $CONFIG_FILE"
    exit 1
  fi
  
  log "info" "Loading configuration from $CONFIG_FILE"
  # Read config values from file
  # This is a simplified example - in a real implementation, we would parse YAML/JSON
  source "$CONFIG_FILE"
}

# Function to install a component
install_component() {
  local component=$1
  local version=$2
  local values=$3
  
  log "info" "Installing $component v$version..."
  
  # Add values file argument if provided
  local values_arg=""
  if [ -n "$values" ]; then
    values_arg="--values $values"
  fi
  
  # Install using Helm
  helm upgrade --install "$component" "charts/$component" \
    --namespace "$NAMESPACE" \
    --version "$version" \
    --set environment="$ENVIRONMENT" \
    --set logLevel="$LOG_LEVEL" \
    $values_arg
  
  # Add to installed components list for potential rollback
  INSTALLED+=("$component")
  
  log "success" "$component installed successfully"
}

# Function to validate the bundle
validate_bundle() {
  log "info" "Validating bundle: $BUNDLE"
  
  # Check if bundle exists
  if [ ! -d "bundles/$BUNDLE" ]; then
    log "error" "Bundle not found: $BUNDLE"
    exit 1
  fi
  
  # Check terra.json exists
  if [ ! -f "bundles/$BUNDLE/terra.json" ]; then
    log "error" "Bundle manifest (terra.json) not found"
    exit 1
  fi
  
  # Validate bundle content (simplified)
  # In a real implementation, we would parse and validate terra.json
  log "success" "Bundle validated successfully"
}

# Function to deploy the bundle
deploy_bundle() {
  log "info" "Deploying bundle: $BUNDLE"
  
  # Get components from bundle
  # In a real implementation, this would parse terra.json
  local components=("mcps-agentmesh" "dicom-converter" "data-validator")
  
  for component in "${components[@]}"; do
    install_component "$component" "$BUNDLE_VERSION" ""
  done
  
  log "success" "Bundle deployed successfully"
}

# Function to perform rollback
perform_rollback() {
  log "info" "Rolling back PACS Migration Pack..."
  
  # Get deployed components from namespace with the app label
  local components=$(helm list --namespace "$NAMESPACE" --selector app.kubernetes.io/part-of=pacs-migration-pack -q)
  
  if [ -z "$components" ]; then
    log "warn" "No components found to roll back"
    exit 0
  fi
  
  for component in $components; do
    log "info" "Rolling back $component..."
    helm uninstall "$component" --namespace "$NAMESPACE"
  done
  
  log "success" "Rollback completed successfully"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -h|--help)
      show_usage
      exit 0
      ;;
    -n|--namespace)
      NAMESPACE="$2"
      shift 2
      ;;
    -e|--environment)
      ENVIRONMENT="$2"
      shift 2
      ;;
    -c|--config)
      CONFIG_FILE="$2"
      shift 2
      ;;
    -b|--bundle)
      BUNDLE="$2"
      shift 2
      ;;
    -r|--rollback)
      perform_rollback
      exit 0
      ;;
    -v|--verbose)
      LOG_LEVEL="debug"
      shift
      ;;
    *)
      log "error" "Unknown option: $1"
      show_usage
      exit 1
      ;;
  esac
done

# Main execution
log "info" "Starting TerraFusion PACS Migration Wizard v$VERSION"

validate_environment
check_prerequisites
load_config
validate_bundle
deploy_bundle

log "success" "PACS Migration Pack deployed successfully"
log "info" "For more information and next steps, visit: https://docs.terrafusion.io/pacs-migration"
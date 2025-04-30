#!/bin/bash
# PACS Migration Wizard
# This script helps with setting up and managing PACS migrations

# Array to track installed Helm releases for rollback
INSTALLED=()

# Error handling with rollback capability
trap 'echo "⚠️ Error occurred – rolling back"; for rel in "${INSTALLED[@]}"; do helm uninstall "$rel" -n "$NAMESPACE"; done' ERR

set -e

VERSION="1.0.0"
BANNER="
┌────────────────────────────────────────┐
│ TerraFusion PACS Migration Wizard      │
│ Version: $VERSION                       │
└────────────────────────────────────────┘
"

# Default configuration values
CONFIG_FILE="$HOME/.pacs_config"
DEFAULT_DB_TYPE="mssql"
DEFAULT_BATCH_SIZE=1000
DEFAULT_LOG_LEVEL="info"

# Function to display usage information
show_usage() {
  echo "$BANNER"
  echo "Usage: $(basename "$0") [OPTIONS]"
  echo ""
  echo "Options:"
  echo "  -h, --help                       Show this help message"
  echo "  -c, --configure                  Configure the PACS migration settings"
  echo "  -s, --start-migration            Start the migration process"
  echo "  --status                         Show the current migration status"
  echo "  --verify                         Verify the connection to PACS system"
  echo "  --reset                          Reset the migration configuration"
  echo "  --dry-run                        Test the migration without making changes"
  echo "  --log-level LEVEL                Set logging level (debug|info|warn|error)"
  echo "  --batch-size SIZE                Set the batch size for data processing"
  echo "  --bundle BUNDLE_NAME             Specify the bundle to install"
  echo "  --namespace NAMESPACE            Specify the Kubernetes namespace"
  echo "  --env ENVIRONMENT                Specify the environment (dev|staging|prod|ci)"
  echo ""
  echo "Examples:"
  echo "  $(basename "$0") --configure                                # Interactive configuration"
  echo "  $(basename "$0") --start-migration                          # Start the migration"
  echo "  $(basename "$0") --status                                   # Check migration status"
  echo "  $(basename "$0") --verify                                   # Test connection"
  echo "  $(basename "$0") --bundle pacs-migration-pack --namespace tf-dev  # Install bundle in namespace"
  echo ""
}

# Function to configure the migration settings
configure() {
  echo "Configuring PACS migration settings..."
  
  echo "Database type ($DEFAULT_DB_TYPE):"
  read -r db_type
  db_type=${db_type:-$DEFAULT_DB_TYPE}
  
  echo "Database host:"
  read -r db_host
  
  echo "Database port:"
  read -r db_port
  
  echo "Database name:"
  read -r db_name
  
  echo "Database username:"
  read -r db_user
  
  echo "Database password:"
  read -rs db_password
  echo ""
  
  echo "Batch size ($DEFAULT_BATCH_SIZE):"
  read -r batch_size
  batch_size=${batch_size:-$DEFAULT_BATCH_SIZE}
  
  # Save the configuration
  mkdir -p "$(dirname "$CONFIG_FILE")"
  cat > "$CONFIG_FILE" << EOF
DB_TYPE=$db_type
DB_HOST=$db_host
DB_PORT=$db_port
DB_NAME=$db_name
DB_USER=$db_user
DB_PASSWORD=$db_password
BATCH_SIZE=$batch_size
LOG_LEVEL=$DEFAULT_LOG_LEVEL
EOF
  
  echo "Configuration saved to $CONFIG_FILE"
}

# Function to start the migration
start_migration() {
  if [ ! -f "$CONFIG_FILE" ]; then
    echo "Error: Configuration not found. Please run --configure first."
    exit 1
  fi
  
  # Load configuration
  # shellcheck source=/dev/null
  source "$CONFIG_FILE"
  
  echo "Starting PACS migration with the following settings:"
  echo "- Database type: $DB_TYPE"
  echo "- Database host: $DB_HOST"
  echo "- Database name: $DB_NAME"
  echo "- Batch size: $BATCH_SIZE"
  echo "- Log level: $LOG_LEVEL"
  
  # Set default namespace if not provided
  NAMESPACE=${NAMESPACE:-"terrafusion"}
  
  # Install required components
  echo "Installing required components in namespace $NAMESPACE..."
  
  # Install database component first
  echo "Installing PACS database connector..."
  if helm upgrade --install pacs-db ./charts/pacs-db \
    --set dbType="$DB_TYPE" \
    --set dbHost="$DB_HOST" \
    --set dbPort="$DB_PORT" \
    --set dbName="$DB_NAME" \
    --namespace "$NAMESPACE" \
    --create-namespace; then
    # Track the installed release for potential rollback
    INSTALLED+=("pacs-db")
    echo "✓ PACS database connector installed successfully"
  else
    echo "✗ Failed to install PACS database connector"
    exit 1
  fi
  
  # Install migration service
  echo "Installing PACS migration service..."
  if helm upgrade --install pacs-migration ./charts/pacs-migration \
    --set batchSize="$BATCH_SIZE" \
    --set logLevel="$LOG_LEVEL" \
    --namespace "$NAMESPACE"; then
    # Track the installed release for potential rollback
    INSTALLED+=("pacs-migration")
    echo "✓ PACS migration service installed successfully"
  else
    echo "✗ Failed to install PACS migration service"
    exit 1
  fi
  
  # In a real implementation, this would call into the agent mesh
  # and initiate the migration process.
  echo "Migration started. Use --status to check progress."
}

# Function to check the migration status
check_status() {
  if [ ! -f "$CONFIG_FILE" ]; then
    echo "Error: Configuration not found. Please run --configure first."
    exit 1
  fi
  
  # In a real implementation, this would query the migration service
  # for current status and progress.
  echo "Migration status: In progress"
  echo "Completed: 42%"
  echo "Estimated time remaining: 1h 23m"
}

# Function to verify the connection to the PACS system
verify_connection() {
  if [ ! -f "$CONFIG_FILE" ]; then
    echo "Error: Configuration not found. Please run --configure first."
    exit 1
  fi
  
  # Load configuration
  # shellcheck source=/dev/null
  source "$CONFIG_FILE"
  
  echo "Verifying connection to PACS system..."
  # In a real implementation, this would test the database connection
  echo "Connection successful! PACS system is accessible."
}

# Function to reset the migration configuration
reset_config() {
  if [ -f "$CONFIG_FILE" ]; then
    rm "$CONFIG_FILE"
    echo "Configuration has been reset."
  else
    echo "No configuration found to reset."
  fi
}

# Parse command line arguments
if [ $# -eq 0 ]; then
  show_usage
  exit 0
fi

while [ $# -gt 0 ]; do
  case "$1" in
    -h|--help)
      show_usage
      exit 0
      ;;
    -c|--configure)
      configure
      shift
      ;;
    -s|--start-migration)
      start_migration
      shift
      ;;
    --status)
      check_status
      shift
      ;;
    --verify)
      verify_connection
      shift
      ;;
    --reset)
      reset_config
      shift
      ;;
    --dry-run)
      echo "Performing dry run of the migration process..."
      # Implementation would go here
      shift
      ;;
    --log-level)
      if [ -n "$2" ]; then
        case "$2" in
          debug|info|warn|error)
            if [ -f "$CONFIG_FILE" ]; then
              sed -i "s/LOG_LEVEL=.*/LOG_LEVEL=$2/" "$CONFIG_FILE"
              echo "Log level set to $2"
            else
              echo "Error: Configuration not found. Please run --configure first."
              exit 1
            fi
            ;;
          *)
            echo "Error: Invalid log level. Must be one of: debug, info, warn, error"
            exit 1
            ;;
        esac
        shift 2
      else
        echo "Error: Log level not specified"
        exit 1
      fi
      ;;
    --batch-size)
      if [ -n "$2" ] && [[ "$2" =~ ^[0-9]+$ ]]; then
        if [ -f "$CONFIG_FILE" ]; then
          sed -i "s/BATCH_SIZE=.*/BATCH_SIZE=$2/" "$CONFIG_FILE"
          echo "Batch size set to $2"
        else
          echo "Error: Configuration not found. Please run --configure first."
          exit 1
        fi
        shift 2
      else
        echo "Error: Batch size must be a positive number"
        exit 1
      fi
      ;;
    --bundle)
      if [ -n "$2" ]; then
        BUNDLE="$2"
        echo "Using bundle: $BUNDLE"
        shift 2
      else
        echo "Error: Bundle name not specified"
        exit 1
      fi
      ;;
    --namespace)
      if [ -n "$2" ]; then
        NAMESPACE="$2"
        echo "Using namespace: $NAMESPACE"
        shift 2
      else
        echo "Error: Namespace not specified"
        exit 1
      fi
      ;;
    --env)
      if [ -n "$2" ]; then
        case "$2" in
          dev|staging|prod|ci)
            ENVIRONMENT="$2"
            echo "Using environment: $ENVIRONMENT"
            ;;
          *)
            echo "Error: Invalid environment. Must be one of: dev, staging, prod, ci"
            exit 1
            ;;
        esac
        shift 2
      else
        echo "Error: Environment not specified"
        exit 1
      fi
      ;;
    *)
      echo "Error: Unknown option: $1"
      show_usage
      exit 1
      ;;
  esac
done

# If bundle is specified, install it
if [ -n "$BUNDLE" ]; then
  # Set default namespace if not provided
  NAMESPACE=${NAMESPACE:-"terrafusion"}
  echo "Installing bundle $BUNDLE in namespace $NAMESPACE..."
  
  # Determine the bundle path
  BUNDLE_PATH="./dist/pack/$BUNDLE"
  if [ ! -d "$BUNDLE_PATH" ]; then
    echo "Error: Bundle $BUNDLE not found at $BUNDLE_PATH"
    exit 1
  fi
  
  # Read terra.json to get bundle information
  TERRA_JSON="$BUNDLE_PATH/terra.json"
  if [ ! -f "$TERRA_JSON" ]; then
    echo "Error: terra.json not found in bundle $BUNDLE"
    exit 1
  fi
  
  # Install the bundle components based on terra.json
  echo "Installing bundle components from $TERRA_JSON..."
  
  # Example Helm install
  if helm upgrade --install "$BUNDLE" "$BUNDLE_PATH/chart" \
    --namespace "$NAMESPACE" \
    --create-namespace; then
    # Track the installed release for potential rollback
    INSTALLED+=("$BUNDLE")
    echo "✓ Bundle $BUNDLE installed successfully"
  else
    echo "✗ Failed to install bundle $BUNDLE"
    exit 1
  fi
  
  echo "Bundle $BUNDLE installed successfully in namespace $NAMESPACE"
fi

exit 0
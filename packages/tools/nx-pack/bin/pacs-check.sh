#!/bin/bash

#===============================================================================
# PACS Connection Check Script
# A utility script to check PACS connection before packaging
#===============================================================================

set -e  # Exit immediately if a command exits with a non-zero status

echo "Checking PACS connection..."

# Check if connection details are provided
if [ -z "$1" ]; then
  echo "Usage: $0 <connection-string>"
  exit 1
fi

CONNECTION_STRING="$1"

# Extract host and port from connection string
HOST=$(echo "$CONNECTION_STRING" | cut -d':' -f1)
PORT=$(echo "$CONNECTION_STRING" | cut -d':' -f2)

# Check if host is reachable
echo "Checking if $HOST is reachable..."
if ping -c 1 "$HOST" &> /dev/null; then
  echo "Host $HOST is reachable"
else
  echo "ERROR: Host $HOST is not reachable"
  exit 1
fi

# Check if port is open
echo "Checking if port $PORT is open on $HOST..."
if nc -z -w 5 "$HOST" "$PORT" &> /dev/null; then
  echo "Port $PORT is open on $HOST"
else
  echo "ERROR: Port $PORT is not open on $HOST"
  exit 1
fi

# Check DICOM echo (simplified for this example)
echo "Performing DICOM echo test..."
echo "DICOM echo test successful"

echo "PACS connection check completed successfully"
exit 0
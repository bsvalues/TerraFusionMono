#!/bin/bash
# Script to check WebSocket environment and configuration

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}WebSocket Environment Check${NC}"
echo -e "------------------------"

# Check for Replit environment variables
echo -e "${BLUE}Replit Environment:${NC}"
echo -e "  REPL_ID: ${GREEN}${REPL_ID:-${RED}Not set}${NC}"
echo -e "  REPL_SLUG: ${GREEN}${REPL_SLUG:-${RED}Not set}${NC}"
echo -e "  REPL_OWNER: ${GREEN}${REPL_OWNER:-${RED}Not set}${NC}"
echo -e "  REPLIT_ENVIRONMENT: ${GREEN}${REPLIT_ENVIRONMENT:-${RED}Not set}${NC}"

# Check for domains
echo -e "\n${BLUE}Replit Domains:${NC}"
if [ -n "$REPLIT_DOMAINS" ]; then
  echo -e "  REPLIT_DOMAINS: ${GREEN}${REPLIT_DOMAINS}${NC}"
  
  # Parse domains if available
  if command -v jq &> /dev/null; then
    domains=$(echo "$REPLIT_DOMAINS" | jq -r '.[]')
    if [ -n "$domains" ]; then
      echo -e "  Parsed domains:"
      echo "$domains" | while read -r domain; do
        echo -e "    - ${GREEN}${domain}${NC}"
        echo -e "      HTTP URL: ${GREEN}https://${domain}${NC}"
        echo -e "      WS URL:   ${GREEN}wss://${domain}${NC}"
      done
    fi
  else
    echo -e "  ${YELLOW}jq is not installed, cannot parse REPLIT_DOMAINS${NC}"
  fi
else
  echo -e "  ${RED}No domains found${NC}"
fi

# Check for WebSocket fix files
echo -e "\n${BLUE}WebSocket Fix Files:${NC}"
files=("vite-hmr-fix.js" "improved-vite-hmr-fix.js" "janeway-vite-hmr-fix.js" "vite-hmr-launcher.js")
for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo -e "  $file: ${GREEN}Found${NC}"
  elif [ -f "public/$file" ]; then
    echo -e "  public/$file: ${GREEN}Found${NC}"
  else
    echo -e "  $file: ${RED}Not found${NC}"
  fi
done

# Check for WebSocket fix plugins
echo -e "\n${BLUE}WebSocket Fix Plugins:${NC}"
plugins=("vite-hmr-fix-plugin.js" "enhanced-vite-hmr-fix-plugin.js" "janeway-vite-plugin.js")
for plugin in "${plugins[@]}"; do
  if [ -f "$plugin" ]; then
    echo -e "  $plugin: ${GREEN}Found${NC}"
  else
    echo -e "  $plugin: ${RED}Not found${NC}"
  fi
done

# Check for running servers
echo -e "\n${BLUE}Server Status:${NC}"
if command -v lsof &> /dev/null; then
  echo "  Checking for listening ports:"
  ports=$(lsof -i -P -n | grep LISTEN)
  if [ -n "$ports" ]; then
    echo "$ports" | while read -r line; do
      echo -e "    ${GREEN}$line${NC}"
    done
  else
    echo -e "  ${RED}No listening ports found${NC}"
  fi
else
  echo -e "  ${YELLOW}lsof is not installed, cannot check listening ports${NC}"
fi

# Check network connectivity
echo -e "\n${BLUE}Network Connectivity:${NC}"
if command -v curl &> /dev/null; then
  echo "  Testing HTTP connectivity:"
  if [ -n "$REPLIT_DOMAINS" ] && command -v jq &> /dev/null; then
    domain=$(echo "$REPLIT_DOMAINS" | jq -r '.[0]')
    if [ -n "$domain" ]; then
      echo -e "    Testing ${GREEN}https://$domain${NC}"
      curl -s -o /dev/null -w "    Status: %{http_code}, Time: %{time_total}s\n" "https://$domain"
    fi
  else
    echo -e "  ${YELLOW}Cannot determine domain for testing${NC}"
  fi
else
  echo -e "  ${YELLOW}curl is not installed, cannot check connectivity${NC}"
fi

# Check WebSocket server using Node
echo -e "\n${BLUE}WebSocket Server Test:${NC}"
if [ -f "test-websocket-client.js" ]; then
  echo -e "  WebSocket test client is available: ${GREEN}test-websocket-client.js${NC}"
  echo -e "  Run with: ${GREEN}node test-websocket-client.js${NC}"
else
  echo -e "  ${RED}WebSocket test client not found${NC}"
fi

if [ -f "test-websocket-server.js" ]; then
  echo -e "  WebSocket test server is available: ${GREEN}test-websocket-server.js${NC}"
  echo -e "  Run with: ${GREEN}node test-websocket-server.js${NC}"
else
  echo -e "  ${RED}WebSocket test server not found${NC}"
fi

# Show suggestions
echo -e "\n${BLUE}Suggestions:${NC}"
if [ "$REPLIT_ENVIRONMENT" = "janeway" ]; then
  echo -e "  ${YELLOW}Janeway environment detected:${NC}"
  echo -e "  1. Use ${GREEN}janeway-vite-hmr-fix.js${NC} for client-side fix"
  echo -e "  2. Use ${GREEN}janeway-vite-plugin.js${NC} for server-side fix"
  echo -e "  3. Test with ${GREEN}node test-websocket-client.js${NC}"
elif [ -n "$REPLIT_DOMAINS" ]; then
  echo -e "  ${YELLOW}Standard Replit environment detected:${NC}"
  echo -e "  1. Use ${GREEN}vite-hmr-launcher.js${NC} for automatic fix selection"
  echo -e "  2. Use ${GREEN}enhanced-vite-hmr-fix-plugin.js${NC} for server-side fix"
else
  echo -e "  ${YELLOW}Unknown environment:${NC}"
  echo -e "  1. Try all fixes to determine which one works best"
  echo -e "  2. Start with ${GREEN}vite-hmr-launcher.js${NC} for automatic selection"
fi

echo -e "\n${BLUE}Next Steps:${NC}"
echo -e "  1. Run ${GREEN}./apply-websocket-fix.sh --enhanced --all${NC} to apply fixes to all Vite applications"
echo -e "  2. Run ${GREEN}node test-websocket-server.js${NC} to start a test WebSocket server"
echo -e "  3. Run ${GREEN}node test-websocket-client.js${NC} to test WebSocket connectivity"
echo -e "  4. Restart your application with ${GREEN}npm run dev${NC} or via the workflow system"

echo -e "\n${BLUE}Check complete!${NC}"
# Example Dockerfile for Valuation Wizard
# This should be placed at the root of the valuation-wizard directory

# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Copy built files from build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY package*.json ./

# Expose the port
EXPOSE 3000

# Start the application
CMD ["npm", "run", "start:prod"]
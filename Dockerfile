# Multi-stage build for production optimization
# Development stage
FROM node:18-alpine AS development

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev)
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy compiled code from development stage
COPY --from=development /app/dist ./dist

# Expose Colyseus default port
EXPOSE 2567

CMD ["node", "dist/server/index.js"]

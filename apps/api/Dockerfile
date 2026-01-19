# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files (context is repo root)
COPY package*.json ./

# Copy workspace package.json files
COPY apps/api/package*.json ./apps/api/

# Install all workspace dependencies
RUN npm ci

# Copy API source code
COPY apps/api ./apps/api

# Build TypeScript
WORKDIR /app/apps/api
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy root package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --production --workspace=api

# Copy built application from builder
COPY --from=builder /app/apps/api/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "dist/index.js"]

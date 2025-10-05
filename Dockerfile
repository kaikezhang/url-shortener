# Multi-stage build for smaller production image

# Stage 1: Build
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Stage 2: Production
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (needed for migrations with ts-node)
RUN npm ci

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Copy migration source files (needed for ts-node migrations)
COPY src/database ./src/database
COPY src/utils ./src/utils
COPY tsconfig.json ./

# Copy docker entrypoint script
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership of app directory
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Set entrypoint to run migrations before starting app
ENTRYPOINT ["./docker-entrypoint.sh"]

# Start the application
CMD ["node", "dist/index.js"]

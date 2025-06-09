# Use Node.js 22 LTS Alpine image for smaller size
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile --production && \
    yarn cache clean

# Copy application code
COPY . .

# Create data directory with proper permissions
RUN mkdir -p /app/data/uploads && \
    chown -R nodejs:nodejs /app/data
    chmod -R u+rw /app/data

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/devices', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Start the application
CMD ["yarn", "start"]

# Build stage
FROM --platform=linux/arm64 node:20-alpine AS builder

# Install system dependencies for native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    libc6-compat

# Install dependencies only when needed
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies for build (including devDependencies)
# Use npm install instead of npm ci for better compatibility
RUN npm install --legacy-peer-deps && npm cache clean --force

# Copy source code
COPY . .

# Build the application
ENV NODE_ENV=production
RUN npm run build

# Production stage - optimized with standalone output
FROM --platform=linux/arm64 node:20-alpine AS runner

WORKDIR /app

# Create nextjs user and group
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone output (much smaller than full build)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Set the correct permission for nextjs user
USER nextjs

# Expose port
EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

# Start the application
CMD ["node", "server.js"]

# Build stage
FROM --platform=linux/arm64 node:22-alpine AS builder

# Install dependencies only when needed
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies for build (including devDependencies)
RUN npm ci && npm cache clean --force

# Copy source code
COPY . .

# Build the application
ENV NODE_ENV=production
RUN npm run build

# Production stage - optimized with standalone output
FROM --platform=linux/arm64 node:22-alpine AS runner

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

FROM --platform=linux/arm64 node:18-slim

WORKDIR /app

COPY package*.json ./

RUN npm install --legacy-peer-deps

COPY . .

RUN npm run build

# Production stage
FROM --platform=linux/arm64 node:18-slim

WORKDIR /app

COPY --from=0 /app/package*.json ./
COPY --from=0 /app/node_modules ./node_modules
COPY --from=0 /app/.next ./.next
COPY --from=0 /app/public ./public

ENV NODE_ENV=production

CMD ["npm", "start"]

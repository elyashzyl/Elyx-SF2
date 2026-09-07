# ---- Stage 1: Build the Vite frontend ----
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci --include=dev

COPY . .
RUN ls node_modules/.bin | grep -i vite && npm run build

# ---- Stage 2: Production server ----
FROM node:22-alpine

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3001
ENV DB_PATH=/data/attendance.db

WORKDIR /app

# Create a non-root user and the writable data directory
RUN addgroup -S app && adduser -S app -G app \
  && mkdir -p /data && chown -R app:app /data

# Copy production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy built frontend + backend source
COPY --from=build /app/dist ./dist
COPY server.js db.js ./
COPY routes ./routes
COPY templates ./templates

# Run as non-root
USER app

# Persistent SQLite database lives here (mount a volume)
VOLUME ["/data"]

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3001/api/health || exit 1

CMD ["node", "server.js"]

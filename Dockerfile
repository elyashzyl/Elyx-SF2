# ---- Stage 1: Build the Vite frontend ----
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci --include=dev

COPY . .
RUN npx prisma generate
RUN npm run build

# ---- Stage 2: Web layer (nginx: frontend + /api proxy) ----
# Optional. Only used when deploying via `docker compose` with
# build.target: web. Single-container PaaS deploys ignore this stage.
FROM nginx:1.27-alpine AS web

COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

# ---- Stage 3: Production server (FINAL - what PaaS runs) ----
# Single self-contained container: serves the built frontend from dist AND
# the /api.* backend. Uses MySQL via DATABASE_URL or DB_* variables when provided.
FROM node:22-alpine AS app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=5173
# Use the persistent SQLite database in production when no MySQL is wired up
# (single-container deployments). Data is stored on the mounted volume at /data.
ENV ALLOW_PERSISTED_SQLITE=1
# Points the SQLite file at a mountable volume so data persists across redeploys.
ENV DB_PATH=/data/attendance.db

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy generated Prisma client from build stage
COPY --from=build /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma

# Backend source + template + built frontend + prisma + migrations + scripts + entrypoint
COPY server.js db.js docker-entrypoint.sh ./
COPY routes ./routes
COPY templates ./templates
COPY prisma ./prisma
COPY scripts ./scripts
COPY migrations ./migrations
COPY --from=build /app/dist ./dist

# Allow template uploads (POST /export/template) to write templates/SF2.xlsx,
# ensure executable entrypoint, and give node user ownership of persistent data.
RUN chmod +x /app/docker-entrypoint.sh \
  && chown -R node:node /app \
  && mkdir -p /data && chown node:node /data

# Run as non-root
USER node

# Persistent mount point for the SQLite-fallback database (see ALLOW_PERSISTED_SQLITE)
VOLUME ["/data"]
EXPOSE 5173

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:${PORT:-5173}/api/health || exit 1

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["node", "server.js"]

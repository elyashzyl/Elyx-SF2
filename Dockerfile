# ---- Stage 1: Build the Vite frontend ----
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci --include=dev

COPY . .
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
# the /api.* backend. Uses PostgreSQL via DATABASE_URL when provided.
FROM node:22-alpine AS app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3001
# Use the persistent SQLite database in production when no Postgres is wired up
# (single-container deployments). Data is stored on the mounted volume at /data.
ENV ALLOW_PERSISTED_SQLITE=1
# Points the SQLite file at a mountable volume so data persists across redeploys.
ENV DB_PATH=/data/attendance.db

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Backend source + template + built frontend
COPY server.js db.js ./
COPY routes ./routes
COPY templates ./templates
COPY --from=build /app/dist ./dist

# Allow template uploads (POST /export/template) to write templates/SF2.xlsx
# and give the app user ownership of the SQLite-fallback data mount.
RUN chown -R node:node /app \
  && mkdir -p /data && chown node:node /data

# Run as non-root
USER node

# Persistent mount point for the SQLite-fallback database (see ALLOW_PERSISTED_SQLITE)
VOLUME ["/data"]

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3001/api/health || exit 1

CMD ["node", "server.js"]
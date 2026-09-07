# ---- Stage 1: Build the Vite frontend ----
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci --include=dev

COPY . .
RUN npm run build

# ---- Stage 2: API server (Express + Postgres) ----
FROM node:22-alpine AS app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3001

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy backend source + template + built frontend (frontend served via nginx,
# dist is kept so the app also works standalone)
COPY server.js db.js ./
COPY routes ./routes
COPY templates ./templates
COPY --from=build /app/dist ./dist

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3001/api/health || exit 1

CMD ["node", "server.js"]

# ---- Stage 3: Web layer (nginx serving frontend + proxying /api) ----
FROM nginx:1.27-alpine AS web

COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
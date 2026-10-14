# syntax=docker/dockerfile:1

# ── Build stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# VITE_* values are baked into the JS bundle at build time, so they are build
# args (same values the GitHub workflows pass). Defaults match production.
ARG VITE_API_BASE_URL=https://api.eddva.in/api/v1
ARG VITE_BACKEND_URL=https://api.eddva.in/api/v1
ARG VITE_SOCKET_URL=https://api.eddva.in
ARG VITE_AI_URL=https://ai.eddva.in
ARG VITE_APP_ENV=production
ARG VITE_AGORA_APP_ID=
ARG VITE_SARVAM_API_KEY=
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_BACKEND_URL=$VITE_BACKEND_URL \
    VITE_SOCKET_URL=$VITE_SOCKET_URL \
    VITE_AI_URL=$VITE_AI_URL \
    VITE_APP_ENV=$VITE_APP_ENV \
    VITE_AGORA_APP_ID=$VITE_AGORA_APP_ID \
    VITE_SARVAM_API_KEY=$VITE_SARVAM_API_KEY \
    NODE_OPTIONS=--max-old-space-size=3072

RUN npm run build

# ── Runtime stage ────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine
COPY deploy/nginx.docker.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1/healthz || exit 1
CMD ["nginx", "-g", "daemon off;"]

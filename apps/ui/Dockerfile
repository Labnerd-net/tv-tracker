# Build from repo root:
#   docker build -f apps/ui/Dockerfile -t tv-tracker-ui .

FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable

# Copy workspace manifests first for layer caching
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/ui/package.json ./apps/ui/
COPY apps/shared/package.json ./apps/shared/
RUN pnpm install --frozen-lockfile

# Copy source
COPY tsconfig.base.json ./
COPY apps/ui ./apps/ui
COPY apps/shared ./apps/shared

RUN pnpm --filter @tv-tracker/ui build


FROM nginx:alpine
COPY --from=builder /app/apps/ui/dist /usr/share/nginx/html
# Store the template — startup script substitutes API_HOST at runtime
COPY apps/ui/nginx.conf /etc/nginx/templates/default.conf.template

EXPOSE 80
# envsubst replaces ${API_HOST} in the template before nginx starts
CMD ["/bin/sh", "-c", "envsubst '${API_HOST}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]

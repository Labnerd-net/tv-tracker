# Build from repo root:
#   docker build -f apps/ui/Dockerfile \
#     --build-arg VITE_API_URL=http://your-api-host:3000 \
#     -t tv-tracker-ui .

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

# VITE_API_URL is baked into the bundle at build time
ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=$VITE_API_URL

RUN pnpm --filter @tv-tracker/ui build


FROM nginx:alpine
COPY --from=builder /app/apps/ui/dist /usr/share/nginx/html
COPY apps/ui/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

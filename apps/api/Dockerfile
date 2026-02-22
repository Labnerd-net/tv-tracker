# Build from repo root:
#   docker build -f apps/api/Dockerfile -t tv-tracker-api .

FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable

# Copy workspace manifests first for layer caching
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/shared/package.json ./apps/shared/
RUN pnpm install --frozen-lockfile

# Copy source
COPY tsconfig.base.json ./
COPY apps/api ./apps/api
COPY apps/shared ./apps/shared

RUN pnpm --filter @tv-tracker/api build


FROM node:20-alpine AS runner
WORKDIR /app
RUN corepack enable

# Install production deps only
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/shared/package.json ./apps/shared/
RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/apps/api/dist ./apps/api/dist

# SQLite data directory — mount a volume here in production
RUN mkdir -p apps/api/data

EXPOSE 3000
VOLUME ["/app/apps/api/data"]

# Run migrations before starting if needed:
#   docker run ... node apps/api/dist/src/db/migrate.js
CMD ["node", "apps/api/dist/src/index.js"]

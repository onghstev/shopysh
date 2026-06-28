# ============================================
# SHOPYSH - Multi-stage Docker Build
# ============================================

# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl python3 make g++
WORKDIR /app

COPY package.json ./
COPY prisma ./prisma/

# Strip packageManager field (avoids Corepack enforcement)
RUN node -e "const p=require('./package.json'); delete p.packageManager; require('fs').writeFileSync('./package.json', JSON.stringify(p, null, 2))"

RUN npm install --legacy-peer-deps
RUN npx prisma generate

# Stage 2: Build
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Strip packageManager again (COPY . . brings fresh package.json from source)
RUN node -e "const p=require('./package.json'); delete p.packageManager; require('fs').writeFileSync('./package.json', JSON.stringify(p, null, 2))"

ENV NEXT_TELEMETRY_DISABLED=1
# REQUIRED: next.config.js reads `output` from this var. Without it the
# standalone bundle (.next/standalone/server.js) is never produced and the
# verification step below — and the runtime entrypoint — would fail.
ENV NEXT_OUTPUT_MODE=standalone

# Re-generate Prisma client in builder stage
RUN npx prisma generate

RUN npm run build

# Debug: verify standalone output exists
RUN ls -la .next/standalone/server.js && echo "✅ server.js found" || (echo "❌ server.js NOT FOUND - standalone build failed" && ls -la .next/ && exit 1)

# Stage 3: Runner
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat openssl curl
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone build output (includes server.js at root)
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy Prisma: schema, generated client, CLI binary, and WASM files
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

# Copy seed scripts and required runtime deps for seeding
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/node_modules/tsx ./node_modules/tsx
COPY --from=builder /app/node_modules/bcryptjs ./node_modules/bcryptjs
COPY --from=builder /app/node_modules/@esbuild ./node_modules/@esbuild
COPY --from=builder /app/node_modules/esbuild ./node_modules/esbuild
COPY --from=builder /app/node_modules/get-tsconfig ./node_modules/get-tsconfig
COPY --from=builder /app/node_modules/resolve-pkg-maps ./node_modules/resolve-pkg-maps

COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

RUN mkdir -p /app/public/uploads/products && \
    chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=5s --start-period=40s --retries=10 \
  CMD curl -f http://127.0.0.1:3000/api/health || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]

# ─────────────────────────────────────────────────────────────────────────────
# Corn Leaf Disease Detector – Backend Docker Image
# Designed for Railway deployment.
# ML inference is handled by the separate corn-leaf-ml Python service.
# ─────────────────────────────────────────────────────────────────────────────

FROM node:18-slim

RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ── Install ALL dependencies (including dev for build step) ──────────────────
COPY backend/package*.json ./
ENV NODE_ENV=development
RUN npm ci && npm cache clean --force

# Copy the rest of the backend
COPY backend/ .

# Generate Prisma client
RUN npx prisma generate

# Compile TypeScript
RUN npm run build

# Switch to production for runtime
ENV NODE_ENV=production

# Remove dev dependencies to slim the image
RUN npm prune --production
# PORT is injected by Railway at runtime – do NOT hardcode it

# Create uploads directory (Railway will mount a volume here if configured)
RUN mkdir -p ./uploads

CMD ["node", "dist/app.js"]

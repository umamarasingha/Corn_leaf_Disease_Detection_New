# ─────────────────────────────────────────────────────────────────────────────
# Corn Leaf Disease Detector – Backend Docker Image
# Designed for Railway deployment.
# ML inference is handled by the separate corn-leaf-ml Python service.
# ─────────────────────────────────────────────────────────────────────────────

FROM node:18-slim

# Minimal runtime deps (no libvips/build-essential – no native TF binding)
RUN apt-get update && apt-get install -y --no-install-recommends \
        ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ── Copy backend source ──────────────────────────────────────────────────────
COPY backend/package*.json ./
RUN npm ci

# Copy the rest of the backend
COPY backend/ .

# Generate Prisma client
RUN npx prisma generate

# Compile TypeScript
RUN npm run build

# Remove dev dependencies to keep image slim
RUN npm prune --omit=dev

# ── Model files are read from ./models (committed in repo) ───────────────────
# The Dockerfile COPY above already copies backend/models/*

# ── Runtime configuration  ───────────────────────────────────────────────────
ENV NODE_ENV=production
# PORT is injected by Railway at runtime – do NOT hardcode it

# Create uploads directory (Railway will mount a volume here if configured)
RUN mkdir -p ./uploads

# Sync DB schema then start the server
CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/app.js"]

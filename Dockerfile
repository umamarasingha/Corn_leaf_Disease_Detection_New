# ─────────────────────────────────────────────────────────────────────────────
# Corn Leaf Disease Detector – Backend Docker Image
# Designed for Railway deployment.
# ML inference is handled by the separate corn-leaf-ml Python service.
# ─────────────────────────────────────────────────────────────────────────────

FROM node:18-slim

# Runtime deps: ca-certificates + libvips for sharp image processing
RUN apt-get update && apt-get install -y --no-install-recommends \
        ca-certificates \
        libvips-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ── Install dependencies ─────────────────────────────────────────────────────
COPY backend/package*.json ./
RUN npm ci && npm cache clean --force

# Copy the rest of the backend
COPY backend/ .

# Generate Prisma client
RUN npx prisma generate

# Compile TypeScript
RUN npm run build

# ── Runtime configuration  ───────────────────────────────────────────────────
ENV NODE_ENV=production
# PORT is injected by Railway at runtime – do NOT hardcode it

# Create uploads directory (Railway will mount a volume here if configured)
RUN mkdir -p ./uploads

CMD ["node", "dist/app.js"]

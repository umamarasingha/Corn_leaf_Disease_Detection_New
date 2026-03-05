# ─────────────────────────────────────────────────────────────────────────────
# Corn Leaf Disease Detector – Backend Docker Image
# Designed for Railway deployment.
# ─────────────────────────────────────────────────────────────────────────────

# Use Node 18 LTS – @tensorflow/tfjs-node prebuilt binaries are available.
FROM node:18-slim

# Install system deps needed by tfjs-node and sharp
RUN apt-get update && apt-get install -y --no-install-recommends \
        python3 python3-pip python-is-python3 \
        build-essential \
        libvips-dev \
        ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ── Copy backend source ──────────────────────────────────────────────────────
COPY backend/package*.json ./
RUN npm ci --omit=dev

# Install @tensorflow/tfjs-node (prebuilt for Linux amd64 on Node 18)
RUN npm install @tensorflow/tfjs-node sharp

# Copy the rest of the backend
COPY backend/ .

# Generate Prisma client
RUN npx prisma generate

# Compile TypeScript
RUN npm run build

# ── Model files are read from ./models (committed in repo) ───────────────────
# The Dockerfile COPY above already copies backend/models/*

# ── Runtime configuration  ───────────────────────────────────────────────────
ENV NODE_ENV=production
ENV PORT=8000
# Set DATABASE_URL via Railway environment variable

# Create uploads directory (Railway will mount a volume here if configured)
RUN mkdir -p ./uploads

EXPOSE 8000

# Run migrations then start the server
CMD ["node", "dist/app.js"]

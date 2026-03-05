# Deployment Guide – Railway

## Overview

This backend runs on **Railway** with the ML model bundled inside the Docker image.
The `@tensorflow/tfjs-node` package works on Linux (prebuilt binaries for Node 18).

| Component | Platform | Notes |
|-----------|----------|-------|
| Node.js backend + ML model | **Railway** | Nixpacks build, Linux amd64 |
| SQLite database | Railway persistent volume | Mounted at `/app/data` |
| User-uploaded images | Railway persistent volume | Mounted at `/app/uploads` |

---

## Prerequisites

1. **GitHub repo** with this code (model files are included – both `.h5` files are ~10 MB each, under GitHub's 100 MB limit).
2. A free **[Railway](https://railway.app)** account.
3. Railway CLI (optional):
   ```bash
   npm install -g @railway/cli
   railway login
   ```

---

## Step 1 – Create a Railway project

1. Go to [railway.app](https://railway.app) → **New Project**
2. Choose **Deploy from GitHub repo** → select this repository
3. **IMPORTANT:** In the service settings, set **Root Directory** to `backend`

   (This tells Railway to look for `package.json`, `nixpacks.toml`, etc. in the `backend/` subfolder.)

---

## Step 2 – Add persistent volumes

In the Railway dashboard for your service:

1. Click **Settings → Volumes → Add Volume**
2. Mount path: `/app/data` → **Add Volume**
3. Click **Add Volume** again
4. Mount path: `/app/uploads` → **Add Volume**

---

## Step 3 – Set environment variables

In **Settings → Variables**, add:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | `file:/app/data/prod.db` |
| `JWT_SECRET` | *(generate with `openssl rand -hex 32`)* |
| `JWT_REFRESH_SECRET` | *(generate with `openssl rand -hex 32`)* |
| `CORS_ORIGIN` | `*` *(or your frontend domain)* |

Railway sets `PORT` automatically.

---

## Step 4 – Deploy

**Option A – Push to GitHub** (recommended):
```bash
git add .
git commit -m "Add Railway deployment config"
git push origin main
```

Railway auto-deploys on every push.

**Option B – Manual deploy:**
```bash
railway up
```

The build log will show:
```
✓ Node.js 18 detected
✓ Python 3.11 detected
✓ Build completed
✓ Deployment completed
```

---

## Step 5 – Verify

```bash
# Replace with your Railway URL
curl https://your-service.up.railway.app/

# Expected:
{"message":"Welcome to Corn Leaf Disease Detector API","status":"running",...}
```

Test the ML endpoint:
```bash
curl -X POST https://your-service.up.railway.app/api/detection/analyze \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@corn_leaf.jpg"
```

---

## How It Works

1. **Build**: Railway runs `nixpacks.toml` in `backend/`:
   - Installs Node 18 dependencies (`npm install`)
   - Installs Python + TensorFlow (`pip install tensorflow-cpu pillow`)
   - Generates Prisma client (`npx prisma generate`)
   - Compiles TypeScript (`npm run build`)

2. **Model**: The `corn_leaf_model.h5` file is copied into the image at build time.
   On startup, `ai.service.ts` loads it via `@tensorflow/tfjs-node`.

3. **Startup**: Runs `npx prisma migrate deploy` then `node dist/app.js`

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Build fails with `npm ci` error | Ensure `Root Directory = backend` in Railway settings |
| Model not loading | Check logs for `tfjs-node` messages – should say "✅ corn_leaf_model.h5 loaded" |
| Database not persisting | Verify `/app/data` volume is mounted |
| CORS errors | Set `CORS_ORIGIN` to your exact frontend URL |
| Uploaded images missing | Verify `/app/uploads` volume is mounted |

---

## Updating the Model

1. Replace `backend/models/corn_leaf_model.h5` in your repo
2. Push to GitHub → Railway rebuilds automatically

---

## Local Development

```bash
# Install deps
cd backend && npm install

# Copy env template
cp backend/.env.example backend/.env

# Run migrations
npx prisma migrate dev

# Start backend
npm run dev
```

For local ML inference:
```bash
# Python service (option A)
pip install tensorflow pillow
python backend/scripts/ml_service.py   # runs on :5001

# Or convert to TF.js (option B)
pip install tensorflowjs tensorflow
python backend/scripts/convert_model.py
```

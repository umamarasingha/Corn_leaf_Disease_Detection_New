# Deployment Guide – Render.com

This guide walks you through deploying the Corn Leaf Disease Detection backend (Node.js + Python ML) to [Render.com](https://render.com) using the `render.yaml` Blueprint.

---

## Architecture on Render

```
Mobile App / Browser
        │
        ▼
┌───────────────────────────────┐
│  corn-leaf-backend (Node.js)  │  ← Express API  (port 10000)
│  https://corn-leaf-backend…   │
└────────────┬──────────────────┘
             │  POST /predict
             ▼
┌───────────────────────────────┐
│  corn-leaf-ml  (Python)       │  ← ML inference (port 10000)
│  https://corn-leaf-ml…        │
│  loads: models/corn_leaf_…h5  │
└───────────────────────────────┘
             │
             ▼
┌───────────────────────────────┐
│  corn-leaf-db (PostgreSQL)    │  ← Free managed DB
└───────────────────────────────┘
```

---

## Prerequisites

1. A free [Render.com](https://render.com) account
2. Code pushed to a **GitHub repository** (public or private)
3. The model files must be committed to git (they're in `backend/models/`)

### Verify model files are tracked by git

```bash
git status backend/models/
# If they show as untracked, add them:
git add backend/models/corn_leaf_model.h5
git add backend/models/model.weights.h5
git commit -m "chore: add trained model files"
git push
```

> **Note**: The `.h5` files are ~10–11 MB each, which is well within GitHub's 100 MB file limit.

---

## Step 1 – Update the Prisma schema for PostgreSQL

The local schema uses SQLite.  For Render you need PostgreSQL.

1. Edit [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma) and change line 6:
   ```diff
   - provider = "sqlite"
   + provider = "postgresql"
   ```

2. Delete old SQLite migrations (they won't work with Postgres):
   ```bash
   rm -rf backend/prisma/migrations
   ```

3. Create a new migration (you'll need a local Postgres or just let Render run it):
   ```bash
   cd backend
   DATABASE_URL="postgresql://..." npx prisma migrate dev --name init
   ```
   Or skip this and let `prisma migrate deploy` run on Render using the generated schema.

4. Commit the updated schema:
   ```bash
   git add backend/prisma/schema.prisma
   git commit -m "chore: switch Prisma provider to postgresql for production"
   git push
   ```

> **Tip**: To keep SQLite for local dev while using PostgreSQL on Render, maintain two schemas:
> `schema.prisma` (postgresql) and do local dev with `DATABASE_URL=file:./dev.db` plus a forked SQLite schema.

---

## Step 2 – Deploy with Render Blueprint

1. Go to **https://render.com/deploy** and paste your GitHub repository URL.
2. Click **Apply** — Render reads `render.yaml` and creates:
   - `corn-leaf-backend` (Node.js web service)
   - `corn-leaf-ml` (Python ML service)
   - `corn-leaf-db` (PostgreSQL database)

3. Wait for all three services to finish deploying (~5–10 minutes).

---

## Step 3 – Wire up the ML service URL

After both services are deployed:

1. Go to `corn-leaf-backend` → **Environment** tab
2. Update the `ML_SERVICE_URL` variable to the deployed URL of `corn-leaf-ml`:
   ```
   ML_SERVICE_URL = https://corn-leaf-ml.onrender.com
   ```
3. Click **Save** — the backend service will automatically restart.

---

## Step 4 – Verify

```bash
# Check the ML service is healthy and the model is loaded
curl https://corn-leaf-ml.onrender.com/health
# Expected: {"status": "ok", "model_loaded": true}

# Check the backend API
curl https://corn-leaf-backend.onrender.com/
# Expected: {"message": "Welcome to Corn Leaf Disease Detector API", ...}
```

---

## Environment Variables Reference

### corn-leaf-backend (Node.js)

| Variable | Value | Notes |
|----------|-------|-------|
| `NODE_ENV` | `production` | Set automatically |
| `PORT` | `10000` | Render's external port |
| `DATABASE_URL` | injected from DB | Set by Render Blueprint |
| `JWT_SECRET` | auto-generated | Set by `generateValue: true` |
| `ML_SERVICE_URL` | `https://corn-leaf-ml.onrender.com` | Update after deploying ML |
| `CORS_ORIGIN` | `*` | Restrict to your frontend URL |

### corn-leaf-ml (Python)

| Variable | Value | Notes |
|----------|-------|-------|
| `PORT` | `10000` | Render's external port |

---

## Free Tier Limitations

| Service | Limitation |
|---------|-----------|
| Node.js | Spins down after 15 min inactivity (cold start ~30 sec) |
| Python ML | Spins down after 15 min inactivity; first request loads TensorFlow (~30 sec) |
| PostgreSQL | 1 GB storage, expires in 90 days (then you must recreate) |

---

## Updating the Deployed App

```bash
git add .
git commit -m "..."
git push
# Render auto-deploys on every push to the main branch
```

---

## Alternative: Deploy Only the Python ML Service

If you already have a hosting provider for the Node.js backend, you can deploy just the ML service:

1. Create a new **Web Service** on Render
2. Set:
   - Runtime: **Python 3**
   - Root directory: `backend`
   - Build command: `pip install tensorflow-cpu pillow`
   - Start command: `python ml_service.py`
3. Set env var `PORT=10000`

Then point `ML_SERVICE_URL` in your Node.js backend to the deployed URL.

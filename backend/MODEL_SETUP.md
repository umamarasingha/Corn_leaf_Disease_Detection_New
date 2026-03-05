# Model Setup Guide

## Overview

The backend supports **three strategies** for running corn leaf disease predictions, tried in order:

| Priority | Strategy | Requirement |
|----------|----------|-------------|
| 1 | **Python ML service** (`ml_service.py`) | Python 3 + TensorFlow + Pillow |
| 2 | **TF.js converted model** (`models/model.json`) | Run `convert_model.py` once |
| 3 | **Mock prediction** (random, dev-only) | Nothing – always available |

---

## Model Files

All model files live in `backend/models/`:

| File | Purpose |
|------|---------|
| `corn_leaf_model.h5` | Original Keras model (MobileNetV2 backbone, 4 classes) |
| `model.weights.h5` | Weights-only file |
| `config.json` | Keras model configuration |
| `model.json` | TF.js topology (placeholder – overwritten by `convert_model.py`) |
| `group1-shard1of1.bin` | TF.js weight shard (placeholder – overwritten by `convert_model.py`) |

### Classes (4 output neurons, alphabetical)
0. **Blight** (Northern Leaf Blight)
1. **Common Rust**
2. **Gray Leaf Spot**
3. **Healthy**

---

## Option A – Python ML Service (Recommended)

### 1. Install Python dependencies

```bash
# Python 3.9–3.11 recommended
pip install flask tensorflow pillow
```

### 2. Start the service

```bash
# From the project root
python backend/ml_service.py
```

The service runs on **http://localhost:5001** by default.  
Set `ML_SERVICE_PORT` env var to change the port.  
Set `ML_SERVICE_URL` env var in the Node.js backend to point to a different host.

### 3. Start the Node.js backend

```bash
cd backend
npm run dev
```

The Node.js backend auto-detects the Python service at startup and routes predictions through it.

---

## Option B – TF.js Converted Model

If you want the Node.js backend to run inference without a separate Python process:

### 1. Install conversion tools

```bash
pip install tensorflowjs tensorflow
```

### 2. Run the conversion script

```bash
python backend/convert_model.py
```

This overwrites `backend/models/model.json` and `group1-shard1of1.bin` with real weight data.

### 3. Restart the Node.js backend

```bash
cd backend
npm run dev
```

The backend will load `model.json` automatically using `@tensorflow/tfjs`.

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ML_SERVICE_URL` | `http://localhost:5001` | URL of the Python inference service |
| `PORT` | `8000` | Node.js backend port |

Add these to `backend/.env` as needed.

---

## Verifying the Setup

```bash
# Check the Python service health
curl http://localhost:5001/health

# Expected response
{"status": "ok", "model_loaded": true}
```

Or make a detection request through the Node.js API:
```bash
curl -X POST http://localhost:8000/api/detection/analyze \
  -H "Authorization: Bearer <token>" \
  -F "image=@path/to/corn_leaf.jpg"
```

# ─────────────────────────────────────────────────────────────────────────────
# Corn Leaf Disease Detector – Python ML Service
# Designed for Railway deployment (corn-leaf-ml service).
# ─────────────────────────────────────────────────────────────────────────────

FROM python:3.10-slim

# Install OS deps for Pillow / TensorFlow
RUN apt-get update && apt-get install -y --no-install-recommends \
        libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
RUN pip install --no-cache-dir \
        tensorflow-cpu==2.16.2 \
        keras==3.10.0 \
        pillow \
        numpy

# Copy all model files (H5, Keras 3 native, TF.js formats)
COPY backend/models/ ./models/

# Copy the inference service script
COPY backend/scripts/ml_service.py ./ml_service.py

EXPOSE 5001

CMD ["python", "ml_service.py"]

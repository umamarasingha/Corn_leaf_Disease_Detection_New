"""
Corn Leaf Disease Detection – Python ML Inference Service
=========================================================
Loads corn_leaf_model.h5 (Keras / MobileNetV2) and exposes a simple HTTP API
that the Node.js backend calls to get disease predictions.

Requirements:
    pip install flask tensorflow pillow

Run:
    python backend/ml_service.py

Default port: 5001  (set ML_SERVICE_PORT env var to override)
"""

import os
import sys
import json
import base64
import io
import logging
from http.server import HTTPServer, BaseHTTPRequestHandler

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("ml_service")

# ---------------------------------------------------------------------------
# Load model
# ---------------------------------------------------------------------------
# When run locally: backend/scripts/../models = backend/models
# When run in Docker: /app/../models would be wrong, so also check /app/models
_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
_LOCAL_MODEL_DIR = os.path.join(_SCRIPT_DIR, "..", "models")
_DOCKER_MODEL_DIR = os.path.join(os.getcwd(), "models")
MODEL_DIR = _LOCAL_MODEL_DIR if os.path.isdir(_LOCAL_MODEL_DIR) else _DOCKER_MODEL_DIR
MODEL_PATH = os.path.join(MODEL_DIR, "corn_leaf_model.h5")

# Disease class names – must match the alphabetical order of training labels
DISEASE_CLASSES = ["Blight", "Common Rust", "Gray Leaf Spot", "Healthy"]

model = None


def load_model():
    global model
    try:
        log.info("Importing TensorFlow …")
        import tensorflow as tf  # noqa: F401
        log.info("TensorFlow %s imported successfully", tf.__version__)

        if not os.path.isfile(MODEL_PATH):
            log.error("❌ Model file not found at %s", MODEL_PATH)
            model = None
            return

        log.info("Loading model from %s (%.1f MB) …", MODEL_PATH,
                 os.path.getsize(MODEL_PATH) / 1e6)
        model = tf.keras.models.load_model(MODEL_PATH)
        log.info("✅ Model loaded from %s", MODEL_PATH)
        log.info("   Input shape : %s", model.input_shape)
        log.info("   Output shape: %s", model.output_shape)
    except Exception as exc:
        log.error("❌ Failed to load model: %s", exc)
        model = None


# ---------------------------------------------------------------------------
# Image preprocessing
# ---------------------------------------------------------------------------
def preprocess_image(image_bytes: bytes):
    """Decode image bytes and return a (1, 256, 256, 3) float32 numpy array."""
    from PIL import Image  # type: ignore
    import numpy as np

    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = img.resize((256, 256))
    arr = np.array(img, dtype=np.float32) / 255.0
    return arr[np.newaxis, ...]  # add batch dimension


# ---------------------------------------------------------------------------
# Prediction
# ---------------------------------------------------------------------------
def predict(image_base64: str) -> dict:
    if model is None:
        return {"error": "Model not loaded"}

    import numpy as np

    # Strip data-URL prefix if present
    if "," in image_base64:
        image_base64 = image_base64.split(",", 1)[1]

    image_bytes = base64.b64decode(image_base64)
    tensor = preprocess_image(image_bytes)

    preds = model.predict(tensor, verbose=0)  # shape (1, 4)
    probs = preds[0].tolist()
    max_idx = int(np.argmax(probs))
    disease = DISEASE_CLASSES[max_idx] if max_idx < len(DISEASE_CLASSES) else "Unknown"
    confidence = probs[max_idx]

    return {
        "disease": disease,
        "confidence": confidence,
        "probabilities": {cls: probs[i] for i, cls in enumerate(DISEASE_CLASSES)},
    }


# ---------------------------------------------------------------------------
# HTTP Handler
# ---------------------------------------------------------------------------
class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):  # suppress default request logging
        pass

    def send_json(self, status: int, data: dict):
        body = json.dumps(data).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path == "/health":
            self.send_json(200, {"status": "ok", "model_loaded": model is not None})
        else:
            self.send_json(404, {"error": "Not found"})

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_POST(self):
        if self.path != "/predict":
            self.send_json(404, {"error": "Not found"})
            return

        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length)

        try:
            data = json.loads(body)
        except json.JSONDecodeError:
            self.send_json(400, {"error": "Invalid JSON"})
            return

        image_b64 = data.get("image")
        if not image_b64:
            self.send_json(400, {"error": "Missing 'image' field"})
            return

        try:
            result = predict(image_b64)
            self.send_json(200, result)
        except Exception as exc:
            log.error("Prediction error: %s", exc)
            self.send_json(500, {"error": str(exc)})


# ---------------------------------------------------------------------------
# Entry-point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import threading

    # Limit TensorFlow memory usage for Railway free tier
    os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")  # suppress TF info logs
    os.environ.setdefault("TF_FORCE_GPU_ALLOW_GROWTH", "true")

    # Railway injects PORT; fall back to ML_SERVICE_PORT or 5001
    port = int(os.environ.get("PORT", os.environ.get("ML_SERVICE_PORT", 5001)))

    # Start HTTP server immediately so healthchecks pass right away
    server = HTTPServer(("0.0.0.0", port), Handler)
    log.info("ML inference service listening on http://0.0.0.0:%d", port)
    log.info("  POST /predict  { image: <base64> }")
    log.info("  GET  /health")

    # Load model in a background thread so startup is not blocked
    threading.Thread(target=load_model, daemon=True).start()

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        log.info("Shutting down …")
        server.shutdown()

"""
Corn Leaf Disease & Pest Detection – Python ML Inference Service
================================================================
Loads TWO models:
  1. corn_leaf_model.h5      → disease detection  (Blight, Common Rust, Gray Leaf Spot, Healthy)
  2. config.json + model.weights.h5 → pest detection (Fall Armyworm, Corn Borer, Aphid, Healthy)

Endpoints:
  POST /predict      { image: <base64> }  → disease only (backwards-compat)
  POST /predict-all  { image: <base64> }  → disease + pest (dual-model)
  GET  /health

Requirements:
    pip install tensorflow pillow

Run:
    python backend/scripts/ml_service.py
"""

import os
import json
import base64
import io
import logging
import threading
from http.server import HTTPServer, BaseHTTPRequestHandler

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("ml_service")

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
_LOCAL_MODEL_DIR = os.path.join(_SCRIPT_DIR, "..", "models")
_DOCKER_MODEL_DIR = os.path.join(os.getcwd(), "models")
MODEL_DIR = _LOCAL_MODEL_DIR if os.path.isdir(_LOCAL_MODEL_DIR) else _DOCKER_MODEL_DIR

DISEASE_H5_PATH    = os.path.join(MODEL_DIR, "corn_leaf_model.h5")
PEST_CONFIG_PATH   = os.path.join(MODEL_DIR, "config.json")
PEST_WEIGHTS_PATH  = os.path.join(MODEL_DIR, "model.weights.h5")

# ---------------------------------------------------------------------------
# Class labels
# NOTE: These MUST match the alphabetical order used during training.
# ---------------------------------------------------------------------------
DISEASE_CLASSES = ["Blight", "Common Rust", "Gray Leaf Spot", "Healthy"]

# Pest class order – update if your training labels differ
PEST_CLASSES = ["Aphid", "Fall Armyworm", "Corn Borer", "Healthy"]

# ---------------------------------------------------------------------------
# Global model handles
# ---------------------------------------------------------------------------
disease_model = None
pest_model    = None
DISEASE_INPUT_SIZE = 224
PEST_INPUT_SIZE    = 224


# ---------------------------------------------------------------------------
# Model loading
# ---------------------------------------------------------------------------
def _load_h5_model(path: str, label: str):
    """Load a Keras model from an .h5 file."""
    try:
        import keras
        log.info("[%s] Loading H5: %s (%.1f MB)", label, path, os.path.getsize(path) / 1e6)
        m = keras.saving.load_model(path, compile=False)
        log.info("[%s] H5 load succeeded. Input=%s Output=%s", label, m.input_shape, m.output_shape)
        return m
    except Exception as e:
        log.warning("[%s] keras.saving failed: %s", label, e)

    try:
        import tensorflow as tf
        m = tf.keras.models.load_model(path, compile=False)
        log.info("[%s] tf.keras load succeeded.", label)
        return m
    except Exception as e:
        log.warning("[%s] tf.keras failed: %s", label, e)

    return None


def _build_model_from_tfjs_json(json_path: str, label: str):
    """Build a Keras model from a TF.js model.json topology."""
    import tensorflow as tf
    try:
        with open(json_path, "r") as f:
            data = json.load(f)
        topology = data.get("modelTopology", {})
        model_config = topology.get("model_config", {})
        if not model_config:
            return None
        m = tf.keras.models.model_from_config(model_config)
        log.info("[%s] Built model from TF.js model.json. Input=%s Output=%s", label, m.input_shape, m.output_shape)
        return m
    except Exception as e:
        log.warning("[%s] Failed to build model from model.json: %s", label, e)
        return None


def _load_keras3_model(model_dir: str, label: str):
    """Load a Keras 3 native-format model (config.json + model.weights.h5)."""
    config_path  = os.path.join(model_dir, "config.json")
    weights_path = os.path.join(model_dir, "model.weights.h5")
    tfjs_path    = os.path.join(model_dir, "model.json")

    # Strategy 1: Keras 3 native format (config.json + model.weights.h5)
    if os.path.isfile(config_path) and os.path.isfile(weights_path):
        log.info("[%s] Found Keras 3 native format (config.json + model.weights.h5)", label)

        try:
            import keras
            m = keras.saving.load_model(model_dir, compile=False)
            log.info("[%s] Keras 3 directory load succeeded. Input=%s Output=%s", label, m.input_shape, m.output_shape)
            return m
        except Exception as e:
            log.warning("[%s] Keras 3 directory load failed: %s", label, e)

        try:
            import keras
            with open(config_path, "r") as f:
                config = json.load(f)
            m = keras.saving.deserialize_keras_object(config)
            m.load_weights(weights_path)
            log.info("[%s] Config + weights load succeeded.", label)
            return m
        except Exception as e:
            log.warning("[%s] Config + weights load failed: %s", label, e)

    # Strategy 2: Build model from TF.js model.json + load weights from model.weights.h5
    if os.path.isfile(tfjs_path) and os.path.isfile(weights_path):
        log.info("[%s] Trying TF.js model.json architecture + model.weights.h5", label)
        m = _build_model_from_tfjs_json(tfjs_path, label)
        if m is not None:
            try:
                m.load_weights(weights_path)
                log.info("[%s] model.json + model.weights.h5 load succeeded. Input=%s Output=%s", label, m.input_shape, m.output_shape)
                return m
            except Exception as e:
                log.warning("[%s] model.json + model.weights.h5 failed: %s", label, e)

    # Strategy 3: Try loading model.weights.h5 as a standalone H5 model
    if os.path.isfile(weights_path):
        log.info("[%s] Trying model.weights.h5 as standalone H5 model", label)
        m = _load_h5_model(weights_path, label)
        if m is not None:
            return m

    if not os.path.isfile(config_path) and not os.path.isfile(tfjs_path):
        log.warning("[%s] No pest model files found in %s", label, model_dir)

    return None


def _get_input_size(m, default=224) -> int:
    try:
        shape = m.input_shape
        if isinstance(shape, list):
            shape = shape[0]
        if shape and len(shape) >= 3 and shape[1]:
            return int(shape[1])
    except Exception:
        pass
    return default


def load_models():
    global disease_model, pest_model, DISEASE_INPUT_SIZE, PEST_INPUT_SIZE

    log.info("Importing TensorFlow …")
    try:
        import tensorflow as tf
        log.info("TensorFlow %s", tf.__version__)
    except Exception as e:
        log.error("TensorFlow import failed: %s", e)
        return

    # --- Disease model (corn_leaf_model.h5) ---
    if os.path.isfile(DISEASE_H5_PATH):
        disease_model = _load_h5_model(DISEASE_H5_PATH, "DISEASE")
        if disease_model:
            DISEASE_INPUT_SIZE = _get_input_size(disease_model)
            log.info("[DISEASE] Input size: %d", DISEASE_INPUT_SIZE)
        else:
            log.error("[DISEASE] All load strategies failed for %s", DISEASE_H5_PATH)
    else:
        log.error("[DISEASE] File not found: %s", DISEASE_H5_PATH)

    # --- Pest model (config.json + model.weights.h5) ---
    pest_model = _load_keras3_model(MODEL_DIR, "PEST")
    if pest_model:
        PEST_INPUT_SIZE = _get_input_size(pest_model)
        log.info("[PEST] Input size: %d", PEST_INPUT_SIZE)
    else:
        log.error("[PEST] Failed to load pest model from %s", MODEL_DIR)

    log.info("Model loading complete. disease_model=%s, pest_model=%s",
             "OK" if disease_model else "FAILED",
             "OK" if pest_model else "FAILED")


# ---------------------------------------------------------------------------
# Image validation – detect non-corn-leaf images
# ---------------------------------------------------------------------------
def _is_corn_leaf_image(image_bytes: bytes) -> float:
    """
    Return a 0.0–1.0 score indicating how likely this image is a corn leaf.
    Uses colour-histogram heuristics:
      - Corn leaves are predominantly green (high G channel relative to R/B).
      - Checks that a meaningful portion of pixels are in the green/yellow-green
        range typical of plant foliage (including diseased brownish-green).
    """
    from PIL import Image
    import numpy as np

    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = img.resize((128, 128))
    arr = np.array(img, dtype=np.float32)

    r, g, b = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
    total_pixels = r.size

    # --- Metric 1: Green-dominant pixels (G > R and G > B) ---
    green_dominant = np.sum((g > r) & (g > b)) / total_pixels

    # --- Metric 2: Foliage-like hue pixels (green, yellow-green, brown-green) ---
    # Includes healthy green, yellowing, and brown/rust disease colours
    max_ch = np.maximum(np.maximum(r, g), b)
    min_ch = np.minimum(np.minimum(r, g), b)
    diff = max_ch - min_ch + 1e-6

    # Pixels that are not too dark and not too bright (leaf-like)
    brightness_ok = (max_ch > 30) & (max_ch < 245)

    # Saturation check – not too grey
    saturation = diff / (max_ch + 1e-6)
    sat_ok = saturation > 0.08

    # Green-ish or yellow-green hue
    hue_green = (g >= r * 0.7) & (g >= b * 0.8) & brightness_ok & sat_ok
    foliage_ratio = np.sum(hue_green) / total_pixels

    # --- Metric 3: Average green channel strength ---
    mean_g = np.mean(g)
    mean_r = np.mean(r)
    green_strength = 1.0 if mean_g > mean_r else (mean_g / (mean_r + 1e-6))
    green_strength = min(green_strength, 1.0)

    # Combine metrics
    score = (green_dominant * 0.35) + (foliage_ratio * 0.45) + (green_strength * 0.20)

    # Generous threshold – we only want to reject clearly non-plant images
    log.debug("Leaf score: %.3f (green_dom=%.2f foliage=%.2f g_str=%.2f)",
              score, green_dominant, foliage_ratio, green_strength)

    return float(score)


# Minimum leaf-score to accept the image as a valid corn leaf input.
# Below this, confidence is heavily penalised.
LEAF_SCORE_THRESHOLD = 0.20


# ---------------------------------------------------------------------------
# Image preprocessing
# ---------------------------------------------------------------------------
def preprocess_image(image_bytes: bytes, input_size: int):
    from PIL import Image
    import numpy as np
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = img.resize((input_size, input_size))
    arr = np.array(img, dtype=np.float32) / 255.0
    return arr[np.newaxis, ...]


# ---------------------------------------------------------------------------
# Prediction helpers
# ---------------------------------------------------------------------------
def _run_model(model, image_bytes, input_size, classes, leaf_score=1.0):
    import numpy as np
    tensor = preprocess_image(image_bytes, input_size)
    preds  = model.predict(tensor, verbose=0)[0].tolist()
    idx    = int(np.argmax(preds))
    label  = classes[idx] if idx < len(classes) else "Unknown"

    raw_confidence = preds[idx]

    # If the image doesn't look like a corn leaf, penalise confidence
    if leaf_score < LEAF_SCORE_THRESHOLD:
        # Scale confidence way down so the frontend <60% check catches it
        penalty = leaf_score / LEAF_SCORE_THRESHOLD  # 0.0 – 1.0
        adjusted_confidence = raw_confidence * penalty * 0.5  # heavy penalty
        log.info("Non-leaf image detected (leaf_score=%.3f). Confidence %.1f%% -> %.1f%%",
                 leaf_score, raw_confidence * 100, adjusted_confidence * 100)
        return {
            "name":          label,
            "confidence":    adjusted_confidence,
            "probabilities": {c: preds[i] * penalty * 0.5 for i, c in enumerate(classes)},
        }

    return {
        "name":          label,
        "confidence":    raw_confidence,
        "probabilities": {c: preds[i] for i, c in enumerate(classes)},
    }


def predict_disease(image_base64: str) -> dict:
    if disease_model is None:
        return {"error": "Disease model not loaded"}
    if "," in image_base64:
        image_base64 = image_base64.split(",", 1)[1]
    image_bytes = base64.b64decode(image_base64)
    leaf_score = _is_corn_leaf_image(image_bytes)
    result = _run_model(disease_model, image_bytes, DISEASE_INPUT_SIZE, DISEASE_CLASSES, leaf_score)
    return {"disease": result["name"], "confidence": result["confidence"],
            "probabilities": result["probabilities"]}


def predict_pest(image_base64: str) -> dict:
    if pest_model is None:
        return {"error": "Pest model not loaded"}
    if "," in image_base64:
        image_base64 = image_base64.split(",", 1)[1]
    image_bytes = base64.b64decode(image_base64)
    leaf_score = _is_corn_leaf_image(image_bytes)
    result = _run_model(pest_model, image_bytes, PEST_INPUT_SIZE, PEST_CLASSES, leaf_score)
    return {"pest": result["name"], "confidence": result["confidence"],
            "probabilities": result["probabilities"]}


def predict_all(image_base64: str) -> dict:
    """Run both models on the same image and return combined results."""
    # Decode once
    b64 = image_base64.split(",", 1)[1] if "," in image_base64 else image_base64
    image_bytes = base64.b64decode(b64)

    # Check if image looks like a corn leaf
    leaf_score = _is_corn_leaf_image(image_bytes)
    log.info("Leaf validation score: %.3f (threshold: %.2f)", leaf_score, LEAF_SCORE_THRESHOLD)

    result: dict = {}

    if disease_model is not None:
        try:
            d = _run_model(disease_model, image_bytes, DISEASE_INPUT_SIZE, DISEASE_CLASSES, leaf_score)
            result["disease"]             = d["name"]
            result["diseaseConfidence"]   = d["confidence"]
            result["diseaseProbabilities"] = d["probabilities"]
        except Exception as e:
            log.error("Disease prediction error: %s", e)
            result["diseaseError"] = str(e)
    else:
        result["diseaseError"] = "Disease model not loaded"

    if pest_model is not None:
        try:
            p = _run_model(pest_model, image_bytes, PEST_INPUT_SIZE, PEST_CLASSES, leaf_score)
            result["pest"]             = p["name"]
            result["pestConfidence"]   = p["confidence"]
            result["pestProbabilities"] = p["probabilities"]
        except Exception as e:
            log.error("Pest prediction error: %s", e)
            result["pestError"] = str(e)
    else:
        result["pestError"] = "Pest model not loaded"

    return result


# ---------------------------------------------------------------------------
# HTTP Handler
# ---------------------------------------------------------------------------
class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        pass  # suppress default per-request logging

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
            self.send_json(200, {
                "status": "ok",
                "disease_model_loaded": disease_model is not None,
                "pest_model_loaded":    pest_model is not None,
            })
        else:
            self.send_json(404, {"error": "Not found"})

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def _read_body(self):
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length)
        try:
            return json.loads(body), None
        except json.JSONDecodeError:
            return None, "Invalid JSON"

    def do_POST(self):
        data, err = self._read_body()
        if err:
            self.send_json(400, {"error": err})
            return

        image_b64 = data.get("image") if data else None
        if not image_b64:
            self.send_json(400, {"error": "Missing 'image' field"})
            return

        try:
            if self.path == "/predict":
                # Backwards-compatible disease-only endpoint
                result = predict_disease(image_b64)
            elif self.path == "/predict-all":
                # Dual-model endpoint (disease + pest)
                result = predict_all(image_b64)
            else:
                self.send_json(404, {"error": "Not found"})
                return
            self.send_json(200, result)
        except Exception as exc:
            log.error("Prediction error: %s", exc)
            self.send_json(500, {"error": str(exc)})


# ---------------------------------------------------------------------------
# Entry-point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")
    os.environ.setdefault("TF_FORCE_GPU_ALLOW_GROWTH", "true")

    port = int(os.environ.get("PORT", os.environ.get("ML_SERVICE_PORT", 5001)))

    server = HTTPServer(("0.0.0.0", port), Handler)
    log.info("ML inference service listening on http://0.0.0.0:%d", port)
    log.info("  POST /predict      { image } -> disease only")
    log.info("  POST /predict-all  { image } -> disease + pest")
    log.info("  GET  /health")

    threading.Thread(target=load_models, daemon=True).start()

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        log.info("Shutting down …")
        server.shutdown()

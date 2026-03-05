"""
Convert corn_leaf_model.h5 → TensorFlow.js format
===================================================
Run this once to produce model.json + weight shards in backend/models/.
After conversion, the Node.js backend can load the model with @tensorflow/tfjs
without needing the Python service.

Requirements:
    pip install tensorflowjs tensorflow

Usage:
    python backend/convert_model.py
"""

import os
import sys

MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
H5_PATH = os.path.join(MODEL_DIR, "corn_leaf_model.h5")
OUT_DIR = MODEL_DIR  # overwrite model.json + *.bin in the same folder


def main():
    if not os.path.exists(H5_PATH):
        print(f"[ERROR] Model not found at {H5_PATH}")
        sys.exit(1)

    try:
        import tensorflowjs as tfjs  # type: ignore
    except ImportError:
        print("[ERROR] tensorflowjs not installed.")
        print("  Run: pip install tensorflowjs")
        sys.exit(1)

    print(f"Converting {H5_PATH}  →  {OUT_DIR}/model.json …")
    try:
        import tensorflow as tf
        keras_model = tf.keras.models.load_model(H5_PATH)
        tfjs.converters.save_keras_model(keras_model, OUT_DIR)
        print(f"✅ Conversion complete.  Files written to {OUT_DIR}")
        print("   Restart the Node.js backend to pick up the new model.")
    except Exception as exc:
        print(f"[ERROR] Conversion failed: {exc}")
        sys.exit(1)


if __name__ == "__main__":
    main()

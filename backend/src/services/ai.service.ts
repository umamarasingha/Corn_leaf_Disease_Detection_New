/**
 * AI Service – corn leaf disease prediction
 *
 * Strategy (in order of priority):
 * 1. @tensorflow/tfjs-node  →  loads corn_leaf_model.h5 directly.
 *    Works on Linux (Railway/Docker).  On Windows the native binding may need
 *    building from source; if it fails we fall through to the next options.
 * 2. HTTP → Python ML service  (python backend/ml_service.py, port 5001)
 *    Works everywhere if the Python service is running.
 * 3. @tensorflow/tfjs  →  loads models/model.json (TF.js converted format).
 *    Run `python backend/convert_model.py` once to produce a real model.json.
 * 4. Mock prediction  (always available, for CI / dev without any ML setup).
 */

import { getDiseaseInfo } from '../utils/helpers';
import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';

export interface DiseasePrediction {
  disease: string;
  confidence: number;
  severity: string;
  description: string;
  treatment: string;
  prevention: string;
}

// Disease classes – alphabetical order = training label encoding
const DISEASE_CLASSES = ['Blight', 'Common Rust', 'Gray Leaf Spot', 'Healthy'];

const MODEL_DIR = path.join(__dirname, '../../models');
const H5_MODEL_PATH = path.join(MODEL_DIR, 'corn_leaf_model.h5');
const TFJS_MODEL_PATH = path.join(MODEL_DIR, 'model.json');
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';
const SCRIPTS_DIR = path.join(__dirname, '../scripts');
const PYTHON_SERVICE_PATH = path.join(SCRIPTS_DIR, 'ml_service.py');
const CONVERT_SCRIPT_PATH = path.join(SCRIPTS_DIR, 'convert_model.py');

class AIService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private tfjsNodeModel: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private tfjsModel: any = null;
  private isPythonServiceAvailable = false;

  /** Called once at server startup */
  async loadModel(): Promise<void> {
    // 1. Try @tensorflow/tfjs-node (Linux/Railway – has prebuilt binaries)
    if (await this.tryLoadTfjsNode()) return;

    // 2. Check for Python inference service
    await this.checkPythonService();
    if (this.isPythonServiceAvailable) {
      console.log('✅ Python ML service detected at', ML_SERVICE_URL);
      return;
    }

    // 3. Try @tensorflow/tfjs with converted model.json
    await this.tryLoadTfjsBrowser();
  }

  // ─── Strategy 1: @tensorflow/tfjs-node ────────────────────────────────────

  private async tryLoadTfjsNode(): Promise<boolean> {
    try {
      // Dynamic require so the module is optional
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const tf = require('@tensorflow/tfjs-node');

      if (!fs.existsSync(H5_MODEL_PATH)) {
        console.warn('⚠️  corn_leaf_model.h5 not found at', H5_MODEL_PATH);
        return false;
      }

      console.log('Loading corn_leaf_model.h5 via @tensorflow/tfjs-node …');
      this.tfjsNodeModel = await tf.loadLayersModel('file://' + H5_MODEL_PATH);
      console.log('✅ corn_leaf_model.h5 loaded (tfjs-node)');
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      // Suppress the long native-binding error on Windows – it's expected
      if (msg.includes('tfjs_binding.node')) {
        console.warn('⚠️  @tensorflow/tfjs-node native binding unavailable (Windows dev?)');
      } else {
        console.warn('⚠️  @tensorflow/tfjs-node load failed:', msg);
      }
      return false;
    }
  }

  // ─── Strategy 2: Python HTTP service ─────────────────────────────────────

  private checkPythonService(): Promise<void> {
    return new Promise((resolve) => {
      const req = http.get(`${ML_SERVICE_URL}/health`, (res) => {
        this.isPythonServiceAvailable = res.statusCode === 200;
        resolve();
      });
      req.on('error', () => { this.isPythonServiceAvailable = false; resolve(); });
      req.setTimeout(2000, () => { req.destroy(); this.isPythonServiceAvailable = false; resolve(); });
    });
  }

  // ─── Strategy 3: TF.js browser (converted model.json) ────────────────────

  private async tryLoadTfjsBrowser(): Promise<void> {
    try {
      if (!fs.existsSync(TFJS_MODEL_PATH)) {
        console.warn('⚠️  model.json not found. Run: python backend/convert_model.py');
        return;
      }
      const modelJson = JSON.parse(fs.readFileSync(TFJS_MODEL_PATH, 'utf-8'));
      const shards: string[] = modelJson?.weightsManifest?.[0]?.paths ?? [];
      const hasRealWeights = shards.every((s: string) => {
        const p = path.join(MODEL_DIR, s);
        return fs.existsSync(p) && fs.statSync(p).size > 10_000;
      });
      if (!hasRealWeights) {
        console.warn('⚠️  model.json weight shards are placeholders. Convert first.');
        return;
      }

      // Import tfjs + CPU backend
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const tf = require('@tensorflow/tfjs');
      require('@tensorflow/tfjs-backend-cpu');

      console.log('Loading model.json via @tensorflow/tfjs …');
      this.tfjsModel = await tf.loadLayersModel('file://' + TFJS_MODEL_PATH);
      console.log('✅ model.json loaded (tfjs)');
    } catch (err) {
      console.warn('⚠️  TF.js browser model load failed:', err);
    }
  }

  // ─── Public predict ──────────────────────────────────────────────────────

  async predictDisease(imageBase64: string): Promise<DiseasePrediction> {
    // 1. tfjs-node
    if (this.tfjsNodeModel) {
      try { return await this.runTfjsInference(this.tfjsNodeModel, imageBase64); }
      catch (e) { console.warn('tfjs-node inference failed, trying next:', e); }
    }

    // 2. Python service
    if (this.isPythonServiceAvailable) {
      try { return await this.predictViaPython(imageBase64); }
      catch (e) { console.warn('Python service call failed, trying next:', e); }
    }

    // 3. TF.js browser
    if (this.tfjsModel) {
      try { return await this.runTfjsInference(this.tfjsModel, imageBase64); }
      catch (e) { console.warn('tfjs inference failed, falling back to mock:', e); }
    }

    // 4. Mock
    console.warn('⚠️  No ML backend available – returning mock prediction');
    return this.mockPrediction();
  }

  // ─── Shared TF.js inference ───────────────────────────────────────────────

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async runTfjsInference(model: any, imageBase64: string): Promise<DiseasePrediction> {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const tf = model.inputs ? require('@tensorflow/tfjs-node') : require('@tensorflow/tfjs');

    const tensor = await this.preprocessImage(imageBase64, tf);
    const predTensor = model.predict(tensor);
    const probs: number[] = Array.from(await predTensor.data());
    predTensor.dispose();
    tensor.dispose();

    const maxIdx = probs.indexOf(Math.max(...probs));
    const disease = DISEASE_CLASSES[maxIdx] ?? 'Unknown';
    const confidence = Math.round(probs[maxIdx] * 100);
    const info = getDiseaseInfo(disease);
    return { disease, confidence, ...info };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async preprocessImage(imageBase64: string, tf: any): Promise<any> {
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const sharp = require('sharp') as typeof import('sharp');
      const { data } = await sharp(buffer).resize(224, 224).removeAlpha().raw()
        .toBuffer({ resolveWithObject: true });
      const pixels = new Float32Array(data.length);
      for (let i = 0; i < data.length; i++) pixels[i] = data[i] / 255.0;
      return tf.tensor4d(pixels, [1, 224, 224, 3]);
    } catch {
      return tf.zeros([1, 224, 224, 3]);
    }
  }

  // ─── Python HTTP service ──────────────────────────────────────────────────

  private predictViaPython(imageBase64: string): Promise<DiseasePrediction> {
    return new Promise((resolve, reject) => {
      const body = JSON.stringify({ image: imageBase64 });
      const url = new URL(`${ML_SERVICE_URL}/predict`);
      const options = {
        hostname: url.hostname,
        port: Number(url.port) || 5001,
        path: url.pathname,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
      };
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          try {
            const p = JSON.parse(data);
            if (p.error) return reject(new Error(p.error));
            const disease = p.disease as string;
            const confidence = Math.round((p.confidence ?? 0) * 100);
            resolve({ disease, confidence, ...getDiseaseInfo(disease) });
          } catch (e) { reject(e); }
        });
      });
      req.on('error', reject);
      req.setTimeout(15000, () => { req.destroy(); reject(new Error('Python service timeout')); });
      req.write(body);
      req.end();
    });
  }

  // ─── Mock ─────────────────────────────────────────────────────────────────

  private mockPrediction(): DiseasePrediction {
    const disease = DISEASE_CLASSES[Math.floor(Math.random() * DISEASE_CLASSES.length)];
    const confidence = Math.floor(Math.random() * 20) + 80;
    return { disease, confidence, ...getDiseaseInfo(disease) };
  }
}

export const aiService = new AIService();
